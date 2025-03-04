# ベースイメージ（必要に応じて変更）
FROM python:3.11-slim

# 作業ディレクトリ作成
WORKDIR /app

# 必要ファイルコピー
COPY requirements.txt requirements.txt

#実際のコードに合わせる(app.pyはバックエンドファイル名)
COPY app.py app.py 

# 依存ライブラリインストール
RUN pip install --no-cache-dir -r requirements.txt

# ポート設定（Copilotは自動設定）
EXPOSE 5000

# 実行コマンド
CMD ["python", "app.py"]
