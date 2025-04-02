FROM rasa/rasa:3.6.11

WORKDIR /app
COPY . /app

# Удаляем файлы .pyc и прочее (на всякий случай)
RUN find . -name '*.pyc' -delete

# Устанавливаем зависимости, если есть кастомные actions
# RUN pip install -r requirements.txt

# Обучаем модель (теперь без лишнего)
RUN rasa train

# Запускаем Rasa-сервер
CMD ["rasa", "run", "--enable-api", "--cors", "*", "--port", "8000"]
