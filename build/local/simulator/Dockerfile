FROM python:2.7

RUN apt-get update && apt-get install -y wget

ENV DOCKERIZE_VERSION v0.6.1
RUN wget https://github.com/jwilder/dockerize/releases/download/$DOCKERIZE_VERSION/dockerize-linux-amd64-$DOCKERIZE_VERSION.tar.gz \
    && tar -C /usr/local/bin -xzvf dockerize-linux-amd64-$DOCKERIZE_VERSION.tar.gz \
    && rm dockerize-linux-amd64-$DOCKERIZE_VERSION.tar.gz

RUN mkdir /app

WORKDIR /app

COPY ./build/requirements.txt requirements.txt

RUN pip install -r requirements.txt

CMD dockerize -wait tcp://backend:5000 -timeout 10s && python /app/classroom_sim.py

