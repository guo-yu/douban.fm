# DOCKER-VERSION 1.0.0

FROM ubuntu:14.04

# install nodejs and npm
RUN apt-get update
RUN apt-get install -y nodejs-legacy
RUN apt-get install -y npm
RUN apt-get install -y git

# install alsa and its deps
RUN apt-get install -y alsa
RUN apt-get install -y libasound2-dev

# install douban.fm -g
RUN npm install douban.fm -g

CMD ["douban.fm"]