FROM rasa/rasa:3.6.11

COPY . /app
WORKDIR /app
RUN rasa train --no-prompt
CMD ["rasa", "run", "--enable-api", "--cors", "*", "--debug", "--port", "8000"]
