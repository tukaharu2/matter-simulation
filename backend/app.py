import io
import os
import boto3
import base64
import json
import torch
import psycopg2
import numpy as np
from PIL import Image
from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_session import Session
from transformers import AutoImageProcessor, AutoModel
from sklearn.metrics.pairwise import cosine_similarity
from dotenv import load_dotenv

# 環境変数のロード
load_dotenv()

# Flask アプリ設定
app = Flask(__name__)
CORS(app)

# Flask-Session設定（サーバーサイドセッション）
app.config['SESSION_TYPE'] = 'filesystem'  # これなら一旦ファイルで管理
app.config['SESSION_PERMANENT'] = False
app.config['SESSION_USE_SIGNER'] = True
Session(app)

# AWS  設定
S3_BUCKET = os.getenv("S3_BUCKET_NAME")
dynamodb = boto3.resource("dynamodb")
image_table = dynamodb.Table(os.getenv("DYNAMODB_TABLE"))
s3_client = boto3.client("s3")

# DINOv2 モデルの読み込み
processor = AutoImageProcessor.from_pretrained("facebook/dinov2-base")
model = AutoModel.from_pretrained("facebook/dinov2-base")

def compute_embedding(image):
    """画像の埋め込みベクトルを計算"""
    inputs = processor(images=image, return_tensors="pt")
    with torch.no_grad():
        outputs = model(**inputs)
        embedding = outputs.last_hidden_state[:, 0, :].squeeze(0)
    return embedding.detach().numpy()

def generate_thumbnail(image, size=(128, 128)):
    """画像のサムネイルを生成"""
    thumbnail = image.copy()
    thumbnail.thumbnail(size)
    return thumbnail

def upload_to_s3(file_bytes, s3_key, content_type="image/jpeg"):
    """S3に画像をアップロード"""
    s3_client.put_object(
        Bucket=S3_BUCKET,
        Key=s3_key,
        Body=file_bytes,
        ContentType=content_type
    )
    return f"https://{S3_BUCKET}.s3.amazonaws.com/{s3_key}"

@app.route("/upload", methods=["POST"])
def upload_image():
    """画像アップロード時に埋め込みベクトルを計算 & 類似画像リストを返す"""
    if "image" not in request.files:
        return jsonify({"error": "No image uploaded"}), 400

    image = request.files["image"]
    img = Image.open(image).convert("RGB")

    # 画像のバイナリデータをBase64にエンコードして保存
    buffered = io.BytesIO()
    img.save(buffered, format="JPEG")
    img_base64 = base64.b64encode(buffered.getvalue()).decode("utf-8")

    # 埋め込みベクトルを計算
    embedding_vector = compute_embedding(img)
    embedding_json = json.dumps(embedding_vector.tolist())

    # 画像データと埋め込みベクトルをセッションに保存
    session["latest_image_info"] = {
        "image_base64": img_base64,
        "embedding_vector": embedding_json
    }

    # DynamoDB からランダムに 200 件取得
    response = image_table.scan(Limit=200)
    results = response.get("Items", [])

    # 類似度計算（ただし、ソートせずそのまま返す）
    response_data = []
    for item in results:
        db_embedding = np.array(json.loads(item["embedding"]))
        similarity = cosine_similarity([embedding_vector], [db_embedding])[0][0]
        response_data.append({
            "s3_thumbnail_url": item["s3_thumbnail_url"],
            "s3_fullsize_url": item["s3_fullsize_url"],
            "similarity": similarity
        })

    return jsonify({
        "similar_images": response_data  # 類似画像リスト
    })


@app.route("/save_image", methods=["POST"])
def save_image():
    try:
        latest = session.get("latest_image_info")
        if not latest:
            return jsonify({"error": "No uploaded image data found in session"}), 400

        # 画像データを復元
        image_bytes = base64.b64decode(latest["image_base64"])
        img = Image.open(io.BytesIO(image_bytes))

        # サムネイル生成
        thumbnail = generate_thumbnail(img)

        # オリジナル画像 & サムネイルをS3にアップロード
        image_key = f"uploads/{session.sid}_original.jpg"
        thumbnail_key = f"uploads/{session.sid}_thumbnail.jpg"

        s3_image_url = upload_to_s3(image_bytes, image_key)
        thumbnail_buffer = io.BytesIO()
        thumbnail.save(thumbnail_buffer, format="JPEG")
        s3_thumb_url = upload_to_s3(thumbnail_buffer.getvalue(), thumbnail_key)

        # DynamoDB に保存
        image_table.put_item(Item={
            "id": session.sid,
            "s3_fullsize_url": s3_image_url,
            "s3_thumbnail_url": s3_thumb_url,
            "embedding": latest["embedding_vector"]
        })

        # 保存完了後にセッションから削除（任意）
        session.pop("latest_image_info", None)

        return jsonify({
            "message": "Image saved successfully",
            "s3_image_url": s3_image_url,
            "thumbnail_url": s3_thumb_url
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)