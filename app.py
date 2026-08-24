from flask import Flask, request, jsonify, session
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime
import os

app = Flask(__name__)

# -------------------------
# APP CONFIGURATION
# -------------------------

app.config["SECRET_KEY"] = "campusshare-development-secret"

app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///campusshare.db"
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

db = SQLAlchemy(app)

CORS(app, supports_credentials=True)


# -------------------------
# DATABASE MODELS
# -------------------------

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)

    name = db.Column(db.String(100), nullable=False)

    email = db.Column(
        db.String(120),
        unique=True,
        nullable=False
    )

    password = db.Column(
        db.String(200),
        nullable=False
    )

    resources = db.relationship(
        "Resource",
        backref="owner",
        lazy=True
    )


class Resource(db.Model):
    id = db.Column(db.Integer, primary_key=True)

    title = db.Column(
        db.String(200),
        nullable=False
    )

    course_code = db.Column(
        db.String(50),
        nullable=False
    )

    description = db.Column(
        db.Text,
        nullable=True
    )

    file_name = db.Column(
        db.String(255),
        nullable=True
    )

    file_url = db.Column(
        db.String(500),
        nullable=True
    )

    upload_date = db.Column(
        db.DateTime,
        default=datetime.utcnow
    )

    user_id = db.Column(
        db.Integer,
        db.ForeignKey("user.id"),
        nullable=False
    )


# -------------------------
# DATABASE CREATION
# -------------------------

with app.app_context():
    db.create_all()


# -------------------------
# HOME
# -------------------------

@app.route("/")
def home():

    return jsonify({
        "message": "CampusShare Backend is running!"
    })


# -------------------------
# REGISTER
# -------------------------

@app.route("/api/register", methods=["POST"])
def register():

    data = request.get_json()

    if not data:
        return jsonify({
            "error": "No data provided"
        }), 400

    name = data.get("name")
    email = data.get("email")
    password = data.get("password")

    if not name or not email or not password:

        return jsonify({
            "error": "Name, email and password are required"
        }), 400

    existing_user = User.query.filter_by(
        email=email
    ).first()

    if existing_user:

        return jsonify({
            "error": "Email already registered"
        }), 409

    hashed_password = generate_password_hash(password)

    user = User(
        name=name,
        email=email,
        password=hashed_password
    )

    db.session.add(user)
    db.session.commit()

    return jsonify({
        "message": "Registration successful",
        "user": {
            "id": user.id,
            "name": user.name,
            "email": user.email
        }
    }), 201


# -------------------------
# LOGIN
# -------------------------

@app.route("/api/login", methods=["POST"])
def login():

    data = request.get_json()

    if not data:

        return jsonify({
            "error": "No data provided"
        }), 400

    email = data.get("email")
    password = data.get("password")

    user = User.query.filter_by(
        email=email
    ).first()

    if not user:

        return jsonify({
            "error": "Invalid email or password"
        }), 401

    if not check_password_hash(
        user.password,
        password
    ):

        return jsonify({
            "error": "Invalid email or password"
        }), 401

    session["user_id"] = user.id

    return jsonify({
        "message": "Login successful",
        "user": {
            "id": user.id,
            "name": user.name,
            "email": user.email
        }
    })


# -------------------------
# LOGOUT
# -------------------------

@app.route("/api/logout", methods=["POST"])
def logout():

    session.pop("user_id", None)

    return jsonify({
        "message": "Logout successful"
    })


# -------------------------
# CURRENT USER
# -------------------------

@app.route("/api/me", methods=["GET"])
def current_user():

    user_id = session.get("user_id")

    if not user_id:

        return jsonify({
            "error": "Not authenticated"
        }), 401

    user = db.session.get(User, user_id)

    if not user:

        return jsonify({
            "error": "User not found"
        }), 404

    return jsonify({
        "id": user.id,
        "name": user.name,
        "email": user.email
    })


# -------------------------
# CREATE RESOURCE
# -------------------------

@app.route("/api/resources", methods=["POST"])
def create_resource():

    user_id = session.get("user_id")

    if not user_id:

        return jsonify({
            "error": "You must be logged in"
        }), 401

    data = request.get_json()

    if not data:

        return jsonify({
            "error": "No data provided"
        }), 400

    title = data.get("title")
    course_code = data.get("course_code")
    description = data.get("description")
    file_name = data.get("file_name")
    file_url = data.get("file_url")

    if not title or not course_code:

        return jsonify({
            "error": "Title and course code are required"
        }), 400

    resource = Resource(
        title=title,
        course_code=course_code,
        description=description,
        file_name=file_name,
        file_url=file_url,
        user_id=user_id
    )

    db.session.add(resource)
    db.session.commit()

    return jsonify({
        "message": "Resource created",
        "resource": {
            "id": resource.id,
            "title": resource.title,
            "course_code": resource.course_code,
            "description": resource.description,
            "file_name": resource.file_name,
            "file_url": resource.file_url,
            "upload_date": resource.upload_date.isoformat(),
            "user_id": resource.user_id
        }
    }), 201


# -------------------------
# GET ALL RESOURCES
# -------------------------

@app.route("/api/resources", methods=["GET"])
def get_resources():

    resources = Resource.query.order_by(
        Resource.upload_date.desc()
    ).all()

    result = []

    for resource in resources:

        result.append({
            "id": resource.id,
            "title": resource.title,
            "course_code": resource.course_code,
            "description": resource.description,
            "file_name": resource.file_name,
            "file_url": resource.file_url,
            "upload_date": resource.upload_date.isoformat(),
            "user_id": resource.user_id,
            "uploaded_by": resource.owner.name
        })

    return jsonify(result)


# -------------------------
# SEARCH RESOURCES
# -------------------------

@app.route("/api/resources/search", methods=["GET"])
def search_resources():

    query = request.args.get(
        "q",
        ""
    ).strip()

    if not query:

        return jsonify([])

    resources = Resource.query.filter(
        db.or_(
            Resource.title.ilike(f"%{query}%"),
            Resource.course_code.ilike(f"%{query}%"),
            Resource.description.ilike(f"%{query}%")
        )
    ).all()

    result = []

    for resource in resources:

        result.append({
            "id": resource.id,
            "title": resource.title,
            "course_code": resource.course_code,
            "description": resource.description,
            "file_name": resource.file_name,
            "file_url": resource.file_url,
            "upload_date": resource.upload_date.isoformat(),
            "uploaded_by": resource.owner.name
        })

    return jsonify(result)


# -------------------------
# GET ONE RESOURCE
# -------------------------

@app.route("/api/resources/<int:resource_id>", methods=["GET"])
def get_resource(resource_id):

    resource = db.session.get(
        Resource,
        resource_id
    )

    if not resource:

        return jsonify({
            "error": "Resource not found"
        }), 404

    return jsonify({
        "id": resource.id,
        "title": resource.title,
        "course_code": resource.course_code,
        "description": resource.description,
        "file_name": resource.file_name,
        "file_url": resource.file_url,
        "upload_date": resource.upload_date.isoformat(),
        "uploaded_by": resource.owner.name
    })


# -------------------------
# UPDATE RESOURCE
# -------------------------

@app.route("/api/resources/<int:resource_id>", methods=["PUT"])
def update_resource(resource_id):

    user_id = session.get("user_id")

    if not user_id:

        return jsonify({
            "error": "You must be logged in"
        }), 401

    resource = db.session.get(
        Resource,
        resource_id
    )

    if not resource:

        return jsonify({
            "error": "Resource not found"
        }), 404

    if resource.user_id != user_id:

        return jsonify({
            "error": "You can only edit your own resources"
        }), 403

    data = request.get_json()

    resource.title = data.get(
        "title",
        resource.title
    )

    resource.course_code = data.get(
        "course_code",
        resource.course_code
    )

    resource.description = data.get(
        "description",
        resource.description
    )

    db.session.commit()

    return jsonify({
        "message": "Resource updated"
    })


# -------------------------
# DELETE RESOURCE
# -------------------------

@app.route("/api/resources/<int:resource_id>", methods=["DELETE"])
def delete_resource(resource_id):

    user_id = session.get("user_id")

    if not user_id:

        return jsonify({
            "error": "You must be logged in"
        }), 401

    resource = db.session.get(
        Resource,
        resource_id
    )

    if not resource:

        return jsonify({
            "error": "Resource not found"
        }), 404

    if resource.user_id != user_id:

        return jsonify({
            "error": "You can only delete your own resources"
        }), 403

    db.session.delete(resource)

    db.session.commit()

    return jsonify({
        "message": "Resource deleted"
    })


# -------------------------
# RUN SERVER
# -------------------------

if __name__ == "__main__":
    app.run(debug=True)