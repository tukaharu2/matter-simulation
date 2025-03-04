import io
import os
import boto3
import json
import torch
import numpy as np
import psycopg2
from flask import Flask, request, jsonify
from flask_cors import CORS
from PIL import Image
from transformers import AutoImageProcessor, AutoModel
from sklearn.metrics.pairwise import cosine_similarity
from werkzeug.utils import secure_filename
from dotenv import load_dotenv


# Flask アプリ設定
app = Flask(__name__)
CORS(app)

# 環境変数のロード
load_dotenv()

# AWS S3 設定
S3_BUCKET = os.getenv("S3_BUCKET_NAME")
s3_client = boto3.client("s3")

# DINOv2 モデルの読み込み
processor = AutoImageProcessor.from_pretrained("facebook/dinov2-base")
model = AutoModel.from_pretrained("facebook/dinov2-base")

# PostgreSQL の設定
# DB_CONFIG = {
#     "dbname": "your_db",
#     "user": "your_user",
#     "password": "your_password",
#     "host": "your_host",
#     "port": "5432",
# }

DB_CONFIG = {
    "dbname": os.getenv("DB_NAME"),
    "user": os.getenv("DB_USER"),
    "password": os.getenv("DB_PASSWORD"),
    "host": os.getenv("DB_HOST"),
    "port": os.getenv("DB_PORT"),
}

# 画像アップロード API
@app.route("/upload", methods=["POST"])
def upload_image():
    if "image" not in request.files:
        return jsonify({"error": "No image uploaded"}), 400

    image = request.files["image"]
    img = Image.open(image).convert("RGB")

    # 埋め込みベクトルを計算
    inputs = processor(images=img, return_tensors="pt")
    with torch.no_grad():
        outputs = model(**inputs)
        embedding = outputs.last_hidden_state[:, 0, :].squeeze(0).cpu().numpy()

    # PostgreSQL からランダムに 200 枚の画像を取得
    conn = psycopg2.connect(**DB_CONFIG)
    cursor = conn.cursor()
    cursor.execute("SELECT s3_thumbnail_url, s3_fullsize_url, embedding FROM images ORDER BY RANDOM() LIMIT 200;")
    results = cursor.fetchall()
    conn.close()

    # 類似度計算（ただし、ソートせずそのまま返す）
    response_data = []
    for s3_thumbnail_url, s3_fullsize_url, db_embedding in results:
        db_embedding = np.array(eval(db_embedding))  # 文字列を NumPy 配列に変換
        similarity = cosine_similarity([embedding], [db_embedding])[0][0]
        response_data.append({
            "s3_thumbnail_url": s3_thumbnail_url,
            "s3_fullsize_url": s3_fullsize_url,
            "similarity": similarity
        })

    return jsonify({"similar_images": response_data})  # すべてのデータをそのまま返す

def compute_embedding(image):
    """画像の埋め込みベクトルを計算"""
    inputs = processor(images=image, return_tensors="pt")
    outputs = model(**inputs)
    embedding = outputs.last_hidden_state[:, 0, :].squeeze(0)
    return embedding.detach().numpy()


def create_thumbnail(image):
    """サムネイルを作成(40x40)"""
    image.thumbnail((40, 40))
    return image


@app.route("/save_image", methods=["POST"])
def save_image():
    """保存ボタンを押したときの処理"""
    try:
        # フロントエンドからデータを受け取る
        file = request.files["file"]
        image = Image.open(file)

        # 画像の埋め込みベクトルを計算
        embedding_vector = compute_embedding(image)
        embedding_json = json.dumps(embedding_vector.tolist())  # JSON に変換

        # 画像ファイル名を決定
        filename = secure_filename(file.filename)
        s3_image_key = f"images/{filename}"
        s3_thumb_key = f"thumbnails/{filename}"

        # サムネイルを作成
        thumbnail = create_thumbnail(image.copy())

        # 画像とサムネを S3 にアップロード
        image_buffer = io.BytesIO()
        image.save(image_buffer, format="JPEG")
        image_buffer.seek(0)
        s3_client.upload_fileobj(image_buffer, S3_BUCKET, s3_image_key, ExtraArgs={"ContentType": "image/jpeg"})

        thumb_buffer = io.BytesIO()
        thumbnail.save(thumb_buffer, format="JPEG")
        thumb_buffer.seek(0)
        s3_client.upload_fileobj(thumb_buffer, S3_BUCKET, s3_thumb_key, ExtraArgs={"ContentType": "image/jpeg"})

        # S3 の URL を取得
        s3_image_url = f"https://{S3_BUCKET}.s3.amazonaws.com/{s3_image_key}"
        s3_thumb_url = f"https://{S3_BUCKET}.s3.amazonaws.com/{s3_thumb_key}"

        # PostgreSQL に保存
        conn = psycopg2.connect(**DB_CONFIG)
        cur = conn.cursor()
        cur.execute(
            "INSERT INTO images (s3_url, thumbnail_url, embedding) VALUES (%s, %s, %s)",
            (s3_image_url, s3_thumb_url, embedding_json),
        )
        conn.commit()
        cur.close()
        conn.close()

        return jsonify({"message": "Image saved", "s3_url": s3_image_url, "thumbnail_url": s3_thumb_url})

    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)
