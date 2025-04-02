FROM rasa/rasa:3.6.11

WORKDIR /app
COPY . /app

# Удаляем .pyc (на всякий случай)
RUN find . -name '*.pyc' -delete

# Тренировка с указанием только чтения
RUN rasa train --config config.yml --domain domain.yml --data data

# Запускаем Rasa-сервер
CMD ["rasa", "run", "--enable-api", "--cors", "*", "--port", "8000"]
