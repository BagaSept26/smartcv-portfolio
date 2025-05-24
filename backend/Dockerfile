FROM python:3.10-slim

#variabel
ENV PYTHONUNBUFFERED 1
#local char
ENV LANG C.UTF-8
#directory
WORKDIR /app

#copyfile requirements
COPY ./requirements.txt /app/requirements.txt

#install depedensi
RUN pip install --no-cache-dir --upgrade pip \
    && pip install --no-cache-dir --prefer-binary -r /app/requirements.txt
 #copy aplikasi ke folder
 COPY ./app /app/app
 #port
 EXPOSE 8000

 #running
 CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "1"]