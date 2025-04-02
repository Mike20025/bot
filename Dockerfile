FROM rasa/rasa:3.6.11

WORKDIR /app
COPY . /app

# Удаляем .pyc (на всякий случай)
RUN find . -name '*.pyc' -delete

# Устанавливаем переменные, чтобы избежать попытки записи
ENV RASA_TELEMETRY_ENABLED=false
ENV RASA_SKIP_ASSISTANT_ID_SETUP=true

# Обучаем модель
RUN rasa train

# Запускаем Rasa-сервер
CMD ["rasa", "run", "--enable-api", "--cors", "*", "--port", "8000"]
