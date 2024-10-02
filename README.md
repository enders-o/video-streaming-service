# Video Streaming System

** The microservices system is as follows **

## Upload Video - Web App (express)
    - users must validate credentials first (send request to auth service)
    - upload video (mp4) file
    - video name and path are written to mysql service
    - the file itself is written to a file storage through the file system service

## Video Streaming - Web App (express)
    - users must validate credentials first (send request to auth service)
    - list of videos and paths are taken from db service 
    - video itself is taken from file system service

## Auth Service (nginx)
    - simple service to validate user credentials
    - [ref](https://codefresh.io/docs/docs/example-catalog/cd-examples/secure-a-docker-container-using-http-basic-auth/)

## File system service
    - Read/write files from a file storage (local/cloud)

## sql db service
    - list of videos and their corresponding path/url
