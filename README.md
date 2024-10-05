# Video Streaming System

** The microservices system is as follows **

## Upload Video - Web App (node)
    - users must validate credentials first (send request to auth service)
    - upload video (mp4) file - streams
    - video name and path are written to mysql service
    - the file itself is written to a file storage through the file system service - to s3

## Video Streaming - Web App (node)
    - users must validate credentials first (send request to auth service)
    - list of videos and paths are taken from db service 
    - video itself is taken from file system service - retreive from s3
    - aws s3 hls

## Auth Service (nginx)
    - simple service to validate user credentials
    - [ref](https://codefresh.io/docs/docs/example-catalog/cd-examples/secure-a-docker-container-using-http-basic-auth/)

## File system service
    - Read/write files from a file storage (local/cloud)
    - In this case it will be an S3 bucket

## sql db service
    - List of videos and their corresponding path/url
    - Most likely will be MariaDB, since i'm using a mac
