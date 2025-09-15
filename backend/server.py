from fastapi import FastAPI, APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional, Dict
import uuid
from datetime import datetime, timezone, timedelta
import jwt
import bcrypt
from enum import Enum

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT settings
JWT_SECRET = os.environ.get('JWT_SECRET', 'your-secret-key-change-in-production')
JWT_ALGORITHM = 'HS256'
JWT_EXPIRY_HOURS = 24 * 7  # 1 week

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Security
security = HTTPBearer()

# Enums
class TaskCategory(str, Enum):
    INTELLIGENCE = "Intelligence"
    PHYSICAL = "Physical"  
    SOCIAL = "Social"
    DISCIPLINE = "Discipline"
    DETERMINATION = "Determination"

class LeagueLevel(str, Enum):
    NORMAL = "Normal"
    NOVICE = "Novice"
    ADVANCED = "Advanced"
    MASTER = "Master"
    LEGENDARY = "Legendary"
    DISCIPLINE_STAR = "Discipline-Star"

class Language(str, Enum):
    ENGLISH = "en"
    SPANISH = "es"
    FRENCH = "fr"
    GERMAN = "de"
    ITALIAN = "it"
    PORTUGUESE = "pt"
    RUSSIAN = "ru"
    CHINESE = "zh"
    JAPANESE = "ja"
    KOREAN = "ko"

# Models
class UserRegister(BaseModel):
    username: str = Field(..., min_length=3, max_length=20)
    email: EmailStr
    password: str = Field(..., min_length=6)
    language: Language = Language.ENGLISH

class UserLogin(BaseModel):
    login: str  # Can be email or username
    password: str

class User(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    username: str
    email: str
    language: Language
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    
    # Gamification fields
    league: LeagueLevel = LeagueLevel.NORMAL
    current_streak: int = 0
    best_streak: int = 0
    total_points: Dict[str, float] = Field(default_factory=lambda: {
        "Intelligence": 0.0,
        "Physical": 0.0,
        "Social": 0.0,
        "Discipline": 0.0,
        "Determination": 0.0
    })
    badges: List[str] = Field(default_factory=list)
    last_task_completion: Optional[datetime] = None
    last_point_deduction: Optional[datetime] = None

class Task(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    category: TaskCategory
    title: str = Field(..., max_length=100)
    description: Optional[str] = Field(None, max_length=500)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    is_completed: bool = False
    completed_at: Optional[datetime] = None
    completion_dates: List[datetime] = Field(default_factory=list)  # Track daily completions

class TaskCreate(BaseModel):
    category: TaskCategory
    title: str = Field(..., max_length=100)
    description: Optional[str] = Field(None, max_length=500)

class TaskUpdate(BaseModel):
    title: Optional[str] = Field(None, max_length=100)
    description: Optional[str] = Field(None, max_length=500)

class DailyProgress(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    date: str  # YYYY-MM-DD format
    completed_categories: List[TaskCategory] = Field(default_factory=list)
    points_earned: Dict[str, float] = Field(default_factory=lambda: {
        "Intelligence": 0.0,
        "Physical": 0.0,
        "Social": 0.0,
        "Discipline": 0.0,
        "Determination": 0.0
    })
    streak_day: bool = False

class QuoteFavorite(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    quote: str
    author: str
    saved_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class LeaderboardEntry(BaseModel):
    username: str
    overall_score: float
    league: LeagueLevel
    current_streak: int
    rank: int

class AuthResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: User

# Helper functions
def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRY_HOURS)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, JWT_SECRET, algorithm=JWT_ALGORITHM)

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        token = credentials.credentials
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authentication credentials"
            )
    except jwt.PyJWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials"
        )
    
    user = await db.users.find_one({"id": user_id})
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found"
        )
    return User(**user)

def calculate_overall_score(points: Dict[str, float]) -> float:
    total = sum(points.values())
    return round(total / 5, 2)

def get_league_multipliers(league: LeagueLevel) -> tuple[float, float]:
    """Returns (points_multiplier, deduction_multiplier)"""
    multipliers = {
        LeagueLevel.NORMAL: (2.0, 4.0),
        LeagueLevel.NOVICE: (1.5, 4.0),
        LeagueLevel.ADVANCED: (1.0, 4.0),
        LeagueLevel.MASTER: (1.0, 3.0),
        LeagueLevel.LEGENDARY: (0.5, 1.5),
        LeagueLevel.DISCIPLINE_STAR: (0.1, 0.4)
    }
    return multipliers.get(league, (2.0, 4.0))

async def check_and_apply_point_deductions(user: User):
    """Check if user missed tasks for 2+ consecutive days and apply deductions"""
    current_date = datetime.now(timezone.utc).date()
    
    # Get user's daily progress for last few days
    recent_progress = await db.daily_progress.find({
        "user_id": user.id,
        "date": {"$gte": (current_date - timedelta(days=7)).isoformat()}
    }).to_list(10)
    
    progress_by_date = {p["date"]: p for p in recent_progress}
    
    consecutive_missed_days = 0
    check_date = current_date - timedelta(days=1)
    
    # Count consecutive days without completing all categories
    while consecutive_missed_days < 7:  # Don't check more than a week back
        date_str = check_date.isoformat()
        progress = progress_by_date.get(date_str)
        
        if not progress or len(progress["completed_categories"]) < 5:
            consecutive_missed_days += 1
        else:
            break
            
        check_date -= timedelta(days=1)
    
    # Apply deductions if 2+ consecutive missed days
    if consecutive_missed_days >= 2:
        _, deduction_multiplier = get_league_multipliers(user.league)
        
        # Check if we already applied deduction recently
        if user.last_point_deduction:
            days_since_deduction = (current_date - user.last_point_deduction.date()).days
            if days_since_deduction < consecutive_missed_days:
                return  # Already applied deduction recently
        
        # Apply deductions to all categories
        updated_points = user.total_points.copy()
        for category in TaskCategory:
            updated_points[category.value] = max(0, updated_points[category.value] - deduction_multiplier)
        
        # Reset streak
        await db.users.update_one(
            {"id": user.id},
            {
                "$set": {
                    "total_points": updated_points,
                    "current_streak": 0,
                    "last_point_deduction": datetime.now(timezone.utc)
                }
            }
        )

# Authentication Routes
@api_router.post("/auth/register", response_model=AuthResponse)
async def register(user_data: UserRegister):
    # Check if username or email already exists
    existing_user = await db.users.find_one({
        "$or": [
            {"username": user_data.username},
            {"email": user_data.email}
        ]
    })
    
    if existing_user:
        if existing_user["username"] == user_data.username:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Username already registered"
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered"
            )
    
    # Create new user
    hashed_password = hash_password(user_data.password)
    user = User(
        username=user_data.username,
        email=user_data.email,
        language=user_data.language
    )
    
    user_dict = user.dict()
    user_dict["password"] = hashed_password
    
    await db.users.insert_one(user_dict)
    
    # Create access token
    access_token = create_access_token(data={"sub": user.id})
    
    return AuthResponse(access_token=access_token, user=user)

@api_router.post("/auth/login", response_model=AuthResponse)
async def login(login_data: UserLogin):
    # Find user by email or username
    user_doc = await db.users.find_one({
        "$or": [
            {"email": login_data.login},
            {"username": login_data.login}
        ]
    })
    
    if not user_doc or not verify_password(login_data.password, user_doc["password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email/username or password"
        )
    
    user = User(**user_doc)
    access_token = create_access_token(data={"sub": user.id})
    
    return AuthResponse(access_token=access_token, user=user)

@api_router.get("/auth/me", response_model=User)
async def get_me(current_user: User = Depends(get_current_user)):
    # Apply any pending point deductions
    await check_and_apply_point_deductions(current_user)
    
    # Get updated user data
    updated_user = await db.users.find_one({"id": current_user.id})
    return User(**updated_user)

# Task Management Routes
@api_router.get("/tasks", response_model=List[Task])
async def get_tasks(current_user: User = Depends(get_current_user)):
    tasks = await db.tasks.find({"user_id": current_user.id}).to_list(100)
    return [Task(**task) for task in tasks]

@api_router.post("/tasks", response_model=Task)
async def create_task(task_data: TaskCreate, current_user: User = Depends(get_current_user)):
    # Check if user already has 2 tasks in this category
    existing_tasks = await db.tasks.count_documents({
        "user_id": current_user.id,
        "category": task_data.category.value
    })
    
    if existing_tasks >= 2:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Maximum 2 tasks allowed per category. You already have {existing_tasks} tasks in {task_data.category.value} category."
        )
    
    task = Task(
        user_id=current_user.id,
        category=task_data.category,
        title=task_data.title,
        description=task_data.description
    )
    
    await db.tasks.insert_one(task.dict())
    return task

@api_router.put("/tasks/{task_id}", response_model=Task)
async def update_task(
    task_id: str, 
    task_update: TaskUpdate, 
    current_user: User = Depends(get_current_user)
):
    task = await db.tasks.find_one({"id": task_id, "user_id": current_user.id})
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found"
        )
    
    update_data = {k: v for k, v in task_update.dict().items() if v is not None}
    
    await db.tasks.update_one(
        {"id": task_id},
        {"$set": update_data}
    )
    
    updated_task = await db.tasks.find_one({"id": task_id})
    return Task(**updated_task)

@api_router.post("/tasks/{task_id}/complete")
async def complete_task(task_id: str, current_user: User = Depends(get_current_user)):
    task = await db.tasks.find_one({"id": task_id, "user_id": current_user.id})
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found"
        )
    
    current_date = datetime.now(timezone.utc)
    today_str = current_date.date().isoformat()
    
    # Check if task was already completed today
    task_obj = Task(**task)
    today_completed = any(
        completion.date() == current_date.date() 
        for completion in task_obj.completion_dates
    )
    
    if today_completed:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Task already completed today"
        )
    
    # Add completion date
    completion_dates = task_obj.completion_dates + [current_date]
    
    # Update task
    await db.tasks.update_one(
        {"id": task_id},
        {
            "$set": {
                "is_completed": True,
                "completed_at": current_date,
                "completion_dates": [d.isoformat() for d in completion_dates]
            }
        }
    )
    
    # Calculate points based on league
    points_multiplier, _ = get_league_multipliers(current_user.league)
    points_earned = points_multiplier
    
    # Update user points
    updated_points = current_user.total_points.copy()
    updated_points[task_obj.category.value] += points_earned
    
    # Get or create daily progress
    daily_progress = await db.daily_progress.find_one({
        "user_id": current_user.id,
        "date": today_str
    })
    
    if not daily_progress:
        daily_progress = DailyProgress(
            user_id=current_user.id,
            date=today_str
        ).dict()
    
    # Update daily progress
    if task_obj.category not in daily_progress["completed_categories"]:
        daily_progress["completed_categories"].append(task_obj.category.value)
    daily_progress["points_earned"][task_obj.category.value] += points_earned
    
    # Check if all categories completed (streak day)
    all_categories_completed = len(daily_progress["completed_categories"]) == 5
    daily_progress["streak_day"] = all_categories_completed
    
    # Update streak if all categories completed
    new_streak = current_user.current_streak
    new_best_streak = current_user.best_streak
    
    if all_categories_completed:
        new_streak += 1
        new_best_streak = max(new_best_streak, new_streak)
        
        # Check for league promotion
        new_league = current_user.league
        new_badges = current_user.badges.copy()
        
        if new_streak == 25 and current_user.league == LeagueLevel.NORMAL:
            new_league = LeagueLevel.NOVICE
            new_badges.append("Bronze Trophy")
        elif new_streak == 50 and current_user.league == LeagueLevel.NOVICE:
            new_league = LeagueLevel.ADVANCED
            new_badges.append("Silver Trophy")
        elif new_streak == 100 and current_user.league == LeagueLevel.ADVANCED:
            new_league = LeagueLevel.MASTER
            new_badges.append("Golden Trophy")
        elif new_streak == 250 and current_user.league == LeagueLevel.MASTER:
            new_league = LeagueLevel.LEGENDARY
            new_badges.append("Diamond Trophy")
        elif new_streak == 500 and current_user.league == LeagueLevel.LEGENDARY:
            new_league = LeagueLevel.DISCIPLINE_STAR
            new_badges.append("Black Trophy")
        
        # Add streak badges
        if new_streak == 3 and "Beginner" not in new_badges:
            new_badges.append("Beginner")
        elif new_streak == 7 and "Disciplined" not in new_badges:
            new_badges.append("Disciplined")
        elif new_streak == 30 and "Master" not in new_badges:
            new_badges.append("Master")
        
        # Update user
        await db.users.update_one(
            {"id": current_user.id},
            {
                "$set": {
                    "total_points": updated_points,
                    "current_streak": new_streak,
                    "best_streak": new_best_streak,
                    "league": new_league.value,
                    "badges": new_badges,
                    "last_task_completion": current_date
                }
            }
        )
    else:
        # Just update points
        await db.users.update_one(
            {"id": current_user.id},
            {
                "$set": {
                    "total_points": updated_points,
                    "last_task_completion": current_date
                }
            }
        )
    
    # Save daily progress
    await db.daily_progress.update_one(
        {"user_id": current_user.id, "date": today_str},
        {"$set": daily_progress},
        upsert=True
    )
    
    return {
        "message": "Task completed successfully",
        "points_earned": points_earned,
        "category": task_obj.category.value,
        "streak_day": all_categories_completed,
        "current_streak": new_streak if all_categories_completed else current_user.current_streak
    }

@api_router.delete("/tasks/{task_id}")
async def delete_task(task_id: str, current_user: User = Depends(get_current_user)):
    result = await db.tasks.delete_one({"id": task_id, "user_id": current_user.id})
    if result.deleted_count == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found"
        )
    return {"message": "Task deleted successfully"}

# Stats and Progress Routes
@api_router.get("/stats/radar")
async def get_radar_stats(current_user: User = Depends(get_current_user)):
    await check_and_apply_point_deductions(current_user)
    updated_user = await db.users.find_one({"id": current_user.id})
    
    return {
        "categories": [
            {"category": "Intelligence", "points": updated_user["total_points"]["Intelligence"]},
            {"category": "Physical", "points": updated_user["total_points"]["Physical"]},
            {"category": "Social", "points": updated_user["total_points"]["Social"]},
            {"category": "Discipline", "points": updated_user["total_points"]["Discipline"]},
            {"category": "Determination", "points": updated_user["total_points"]["Determination"]}
        ],
        "overall_score": calculate_overall_score(updated_user["total_points"])
    }

@api_router.get("/leaderboard", response_model=List[LeaderboardEntry])
async def get_leaderboard(language: Optional[Language] = None, current_user: User = Depends(get_current_user)):
    query = {}
    if language:
        query["language"] = language.value
    
    users = await db.users.find(query).to_list(1000)
    
    leaderboard = []
    for user in users:
        overall_score = calculate_overall_score(user["total_points"])
        leaderboard.append({
            "username": user["username"],
            "overall_score": overall_score,
            "league": user["league"],
            "current_streak": user["current_streak"],
            "rank": 0  # Will be set after sorting
        })
    
    # Sort by overall score descending
    leaderboard.sort(key=lambda x: x["overall_score"], reverse=True)
    
    # Add ranks (show only top 100)
    for i, entry in enumerate(leaderboard[:100]):
        entry["rank"] = i + 1
    
    return leaderboard[:100]

# Quote Management Routes
@api_router.get("/quotes/favorites", response_model=List[QuoteFavorite])
async def get_favorite_quotes(current_user: User = Depends(get_current_user)):
    favorites = await db.quote_favorites.find({"user_id": current_user.id}).to_list(100)
    return [QuoteFavorite(**fav) for fav in favorites]

@api_router.post("/quotes/favorites", response_model=QuoteFavorite)
async def save_favorite_quote(
    quote: str, 
    author: str, 
    current_user: User = Depends(get_current_user)
):
    favorite = QuoteFavorite(
        user_id=current_user.id,
        quote=quote,
        author=author
    )
    
    await db.quote_favorites.insert_one(favorite.dict())
    return favorite

@api_router.delete("/quotes/favorites/{quote_id}")
async def remove_favorite_quote(quote_id: str, current_user: User = Depends(get_current_user)):
    result = await db.quote_favorites.delete_one({
        "id": quote_id, 
        "user_id": current_user.id
    })
    
    if result.deleted_count == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Favorite quote not found"
        )
    return {"message": "Favorite quote removed"}

# Quote Management Routes
@api_router.get("/quotes/favorites", response_model=List[QuoteFavorite])
async def get_favorite_quotes(current_user: User = Depends(get_current_user)):
    favorites = await db.quote_favorites.find({"user_id": current_user.id}).to_list(100)
    return [QuoteFavorite(**fav) for fav in favorites]

@api_router.post("/quotes/favorites", response_model=QuoteFavorite)
async def save_favorite_quote(
    quote: str, 
    author: str, 
    current_user: User = Depends(get_current_user)
):
    favorite = QuoteFavorite(
        user_id=current_user.id,
        quote=quote,
        author=author
    )
    
    await db.quote_favorites.insert_one(favorite.dict())
    return favorite

@api_router.delete("/quotes/favorites/{quote_id}")
async def remove_favorite_quote(quote_id: str, current_user: User = Depends(get_current_user)):
    result = await db.quote_favorites.delete_one({
        "id": quote_id, 
        "user_id": current_user.id
    })
    
    if result.deleted_count == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Favorite quote not found"
        )
    return {"message": "Favorite quote removed"}

@api_router.delete("/quotes/favorites")
async def remove_favorite_by_content(
    quote: str,
    author: str,
    current_user: User = Depends(get_current_user)
):
    result = await db.quote_favorites.delete_one({
        "user_id": current_user.id,
        "quote": quote,
        "author": author
    })
    
    if result.deleted_count == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Favorite quote not found"
        )
    return {"message": "Favorite quote removed"}

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()