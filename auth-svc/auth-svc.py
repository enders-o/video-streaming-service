from flask import Flask, request, make_response, render_template, redirect
from dotenv import load_dotenv
import os

load_dotenv()

app = Flask(__name__)

USERNAME = os.getenv("AUTH_USERNAME")
PASSWORD = os.getenv("AUTH_PASSWORD")

@app.route('/login', methods=['GET'])
def login_page():
    # Extract the redirect URL from the query parameters
    redirect_url = request.args.get('redirect') 
    if not redirect_url:
        redirect_url = 'http://localhost:3000/'

    # Render the login page with the redirect URL as a hidden input
    return render_template('login.html', redirect_url=redirect_url)
    
@app.route('/api/login', methods=['POST'])
def api_login():
    data = request.form
    username = data.get('username')
    password = data.get('password')
    redirect_url = data.get('redirect')  

    # Check credentials
    if username == USERNAME and password == PASSWORD:
        # Create a response to set the cookie
        response = make_response(redirect(redirect_url))
        
        # Set a cookie, e.g., `auth_token`, that will be used for authentication
        response.set_cookie('auth_token', 'USER_AUTH_TOKEN', httponly=True, max_age=60*60)  # Expires in 1 hour
        
        return response
    else:
        return render_template('login.html', redirect_url=redirect_url, error="Invalid credentials. Please try again.")


# Logout endpoint
@app.route('/api/logout', methods=['POST'])
def logout():
    response = make_response(redirect('/login'))  # Redirect to the login page
    response.set_cookie('auth_token', '', expires=0)  # Remove the auth_token cookie
    return response


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8000)
