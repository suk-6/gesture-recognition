FROM python:3.11-slim

RUN apt update
RUN apt install -y libgl1-mesa-glx libglib2.0-0 libsm6 libxrender1 libxext6

WORKDIR /root

COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .

CMD ["python", "app.py"]