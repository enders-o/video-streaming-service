# Video Streaming System

## Architecture diagram
![image](https://github.com/user-attachments/assets/01ea6876-c67e-4f9f-8e5f-7c794bc7433f)

## docker-compose.yml
#### 1. Upload Web App (`upload-webapp`)

- **Description**: This service allows users to upload video files.
- **Build Context**: `./upload-webapp`
- **Ports**: 
  - Host: `3000`
  - Container: `3000`
- **Dependencies**: 
  - `auth-svc`: Authentication Service
  - `file-svc`: File System Service
- **Volumes**: 
  - `myapp-temp:/usr/src/app/temp`: Temporary storage for file uploads.
- **Networks**: 
  - `bridge-net`: Internal network for inter-service communication.
- **Environment Variables**: 
  - Loaded from `.env` file.

#### 2. Authentication Service (`auth-svc`)

- **Description**: This service validates user credentials. It manages user sessions and authentication cookies.
- **Build Context**: `./auth-svc`
- **Ports**: 
  - Host: `8000`
  - Container: `8000`
- **Networks**: 
  - `bridge-net`
- **Environment Variables**: 
  - Loaded from `.env` file.

#### 3. File System Service (`file-svc`)

- **Description**: This service writes and reads video files to/from S3 storage. 
- **Build Context**: `./file-svc`
- **Ports**: 
  - Host: `4000`
  - Container: `4000`
- **Volumes**: 
  - `myapp-temp:/usr/src/app/temp`: Temporary storage for files.
- **Networks**: 
  - `bridge-net`
- **Environment Variables**: 
  - Loaded from `.env` file.

#### 4. Streaming Web App (`streaming-svc`)

- **Description**: This service allows users to view videos.
- **Build Context**: `./streaming-webapp`
- **Ports**: 
  - Host: `3100`
  - Container: `3100`
- **Dependencies**: 
  - `auth-svc`: Authentication Service
  - `file-svc`: File System Service
- **Networks**: 
  - `bridge-net`
- **Environment Variables**: 
  - Loaded from `.env` file.

#### 5. Database Service (`database`)

- **Description**: This service uses MariaDB to store video names and paths.
- **Image**: `mariadb:10.5`
- **Container Name**: `mariadb_container`
- **Environment Variables**:
  - `MYSQL_ROOT_PASSWORD`: Database root password (specified in the `.env` file).
  - `MYSQL_DATABASE`: Name of the database created on startup (set to `video_db`).
- **Volumes**: 
  - `./mariadb_data:/var/lib/mysql`: Data persistence for the MariaDB database.
  - `./database:/docker-entrypoint-initdb.d`: Directory for initial SQL scripts.
- **Ports**: 
  - Host: `3306`
  - Container: `3306`
- **Networks**: 
  - `bridge-net`

### Networks

- **bridge-net**: 
  - Type: `bridge`
  - Description: A bridge network that allows services to communicate with each other.

### Volumes

- **myapp-temp**: 
  - Type: External: `false`
  - Description: A temporary storage volume used by the upload and file system services to manage file uploads to S3.

## .env - Enviornmental Variables
```python
AWS_ACCESS_KEY_ID= # The AWS access key for an IAM user that has permissions to upload and download files from the S3 Bucket.
AWS_SECRET_ACCESS_KEY= # The AWS secret access key for the same IAM user.
S3_REGION= # The AWS region that the S3 Bucket is hosted in.
S3_BUCKET= # The name of the S3 Bucket.
DB_USER= # The username of the MarinaDB user that has full access to the "videos" table in the database.
DB_PASS= # The password of the same MarinaDB user.
AUTH_USERNAME= # The username that the authentication service will use to authenticate users.
AUTH_PASSWORD= # The password that the authentication service will use to authenticate users.
```

## upload-webapp - Upload Video (Web)
- Programming language: **Node.js**
- Web application framework: **Express.js**

The upload web application service is a node and express js microservice responsible for allowing users to upload videos, that they can later view. It utilizes multer to store uploaded files in a temp folder. Once a user uploads a video it sends a request to the file-svc with the path to the file in the temp folder for the file-svc to upload to S3. It also stores the name and S3 path to the SQL database. After the user uploads a video it should show a success page. Utilizes the auth-svc for authentication.

## streaming-webapp - Video Streaming (Web)
- Programming language: **Node.js**
- Web application framework: **Express.js**
    - users must validate credentials first (send request to auth service)
    - list of videos and paths are taken from db service 
    - video itself is taken from file system service - retreive from s3

The streaming web application service is a node and express js microservice responsible for allowing users to view all videos stored, and view selected videos. The lists of videos and paths are read from the database service and displayed to the user in a list view. If a user clicks on video, the streaming web app makes a request to file-svc for the video requested, then file-svc responds with the selected video, which is then displayed to the user.

## auth-svc - Authentication Service
- Programming language: **Python**
- Web application framework: **Flask**

The Authentication Service is a Flask-based microservice responsible for managing user authentication within the Video Streaming System. It provides endpoints for user login, logout, and rendering the login page. The service verifies user credentials against environment variables and manages authentication tokens using cookies.

### Routes
#### Login Page Route
- Method: `GET`
- Description: Renders the login page.
- Parameters:
    - `redirect`: A URL to redirect the user after successful login.

#### Login API Route
- Method: `POST`
- Description: Validates user credentials against stored environment variables. If valid, sets an authentication cookie and redirects the user to the URL specified in `redirect`.
- Parameters:
    - `redirect`: A URL to redirect the user after successful login.
    - `password`: The password submitted by the user.
    - `username`: The username submitted by the user.
- Responses:
    - **Success**: Sets an auth_token cookie and redirects to the specified URL.
    - **Failure**: Renders the login page again with an error message.

#### Logout Route
- Method: `POST`
- Description: Logs the user out by removing the authentication cookie and redirecting to the login page.
- Responses:
    - `redirect`: Redirects to the login page after clearing the `auth_token` cookie.


## file-svc - File System Service
- Programming language: **Node.js**
- Web application framework: **Express.js**
    - Upload endpoint /api/upload - Uploads file from local to s3 and deletes the local file
    - Download endpoint /api/download - Streams video content from s3

The file system service is a node and express js microservice responsible for storing uploaded files to S3 and retrieving requested files from S3. When a user uploads a file, it recieves the path to that file in a local temporary directory. It then reads the file and uploads it to S3. After uploading the file it deletes the temporary file as it's no longer needed. When a user requests a video to view, it recieves the name of the video, which should correspond to a key in your S3 bucket. It then retrieves the file from the S3 bucket and responds with data in that file.

## database - Database Service
- Programming language: **SQL**
- Database: **MariaDB**
    - Columns: video_name and video_path
    - video_path is the corresponding url of the s3bucket
    - Writes to db once video is uploaded
    - MariaDB used as an alternative to MySQL for MacOS
