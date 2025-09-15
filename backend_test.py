import requests
import sys
import json
from datetime import datetime
import time

class GrowthTrackerAPITester:
    def __init__(self, base_url="https://growth-tracker-22.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.token = None
        self.user_id = None
        self.tests_run = 0
        self.tests_passed = 0
        self.created_tasks = []

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.api_url}/{endpoint}"
        test_headers = {'Content-Type': 'application/json'}
        
        if self.token:
            test_headers['Authorization'] = f'Bearer {self.token}'
        
        if headers:
            test_headers.update(headers)

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=test_headers, timeout=10)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=test_headers, timeout=10)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=test_headers, timeout=10)
            elif method == 'DELETE':
                response = requests.delete(url, headers=test_headers, timeout=10)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    return True, response.json()
                except:
                    return True, {}
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                try:
                    error_detail = response.json()
                    print(f"   Error: {error_detail}")
                except:
                    print(f"   Response text: {response.text}")
                return False, {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_user_registration(self):
        """Test user registration"""
        timestamp = int(time.time())
        test_data = {
            "username": f"testuser_{timestamp}",
            "email": f"test_{timestamp}@example.com",
            "password": "TestPass123!",
            "language": "en"
        }
        
        success, response = self.run_test(
            "User Registration",
            "POST",
            "auth/register",
            200,
            data=test_data
        )
        
        if success and 'access_token' in response:
            self.token = response['access_token']
            self.user_id = response['user']['id']
            print(f"   Registered user: {test_data['username']}")
            return True
        return False

    def test_user_login(self):
        """Test user login with existing credentials"""
        if not self.user_id:
            print("❌ Cannot test login - no user registered")
            return False
            
        # Try to login with a test user (we'll use the registered user)
        timestamp = int(time.time())
        login_data = {
            "login": f"testuser_{timestamp}",
            "password": "TestPass123!"
        }
        
        success, response = self.run_test(
            "User Login",
            "POST", 
            "auth/login",
            200,
            data=login_data
        )
        
        if success and 'access_token' in response:
            self.token = response['access_token']
            return True
        return False

    def test_get_user_profile(self):
        """Test getting current user profile"""
        success, response = self.run_test(
            "Get User Profile",
            "GET",
            "auth/me",
            200
        )
        return success

    def test_create_task(self, category, title, description=None):
        """Test creating a task"""
        task_data = {
            "category": category,
            "title": title,
            "description": description or f"Test {category} task"
        }
        
        success, response = self.run_test(
            f"Create {category} Task",
            "POST",
            "tasks",
            200,
            data=task_data
        )
        
        if success and 'id' in response:
            self.created_tasks.append(response['id'])
            return response['id']
        return None

    def test_get_tasks(self):
        """Test getting all user tasks"""
        success, response = self.run_test(
            "Get All Tasks",
            "GET",
            "tasks",
            200
        )
        return success

    def test_complete_task(self, task_id):
        """Test completing a task"""
        success, response = self.run_test(
            "Complete Task",
            "POST",
            f"tasks/{task_id}/complete",
            200
        )
        return success

    def test_update_task(self, task_id):
        """Test updating a task"""
        update_data = {
            "title": "Updated Task Title",
            "description": "Updated description"
        }
        
        success, response = self.run_test(
            "Update Task",
            "PUT",
            f"tasks/{task_id}",
            200,
            data=update_data
        )
        return success

    def test_delete_task(self, task_id):
        """Test deleting a task"""
        success, response = self.run_test(
            "Delete Task",
            "DELETE",
            f"tasks/{task_id}",
            200
        )
        return success

    def test_radar_stats(self):
        """Test getting radar chart statistics"""
        success, response = self.run_test(
            "Get Radar Stats",
            "GET",
            "stats/radar",
            200
        )
        return success

    def test_leaderboard(self):
        """Test getting leaderboard"""
        success, response = self.run_test(
            "Get Leaderboard",
            "GET",
            "leaderboard",
            200
        )
        return success

    def test_leaderboard_with_language_filter(self):
        """Test getting leaderboard with language filter"""
        success, response = self.run_test(
            "Get Leaderboard (English)",
            "GET",
            "leaderboard?language=en",
            200
        )
        return success

    def test_save_favorite_quote(self):
        """Test saving a favorite quote"""
        quote_data = {
            "quote": "The only way to do great work is to love what you do.",
            "author": "Steve Jobs"
        }
        
        success, response = self.run_test(
            "Save Favorite Quote",
            "POST",
            f"quotes/favorites?quote={quote_data['quote']}&author={quote_data['author']}",
            200
        )
        return success

    def test_get_favorite_quotes(self):
        """Test getting favorite quotes"""
        success, response = self.run_test(
            "Get Favorite Quotes",
            "GET",
            "quotes/favorites",
            200
        )
        return success

    def test_task_category_limit(self):
        """Test that users can't create more than 2 tasks per category"""
        category = "Intelligence"
        
        # Create first task
        task1_id = self.test_create_task(category, "First Intelligence Task")
        if not task1_id:
            return False
            
        # Create second task
        task2_id = self.test_create_task(category, "Second Intelligence Task")
        if not task2_id:
            return False
            
        # Try to create third task (should fail)
        task_data = {
            "category": category,
            "title": "Third Intelligence Task",
            "description": "This should fail"
        }
        
        success, response = self.run_test(
            "Test Task Limit (Should Fail)",
            "POST",
            "tasks",
            400,  # Expecting 400 Bad Request
            data=task_data
        )
        
        return success  # Success means it correctly rejected the third task

def main():
    print("🚀 Starting Growth Tracker API Tests")
    print("=" * 50)
    
    tester = GrowthTrackerAPITester()
    
    # Test Authentication Flow
    print("\n📝 AUTHENTICATION TESTS")
    print("-" * 30)
    
    if not tester.test_user_registration():
        print("❌ Registration failed, stopping tests")
        return 1
    
    if not tester.test_get_user_profile():
        print("❌ Profile fetch failed")
        return 1
    
    # Test Task Management
    print("\n📋 TASK MANAGEMENT TESTS")
    print("-" * 30)
    
    # Create tasks in different categories
    categories = ["Intelligence", "Physical", "Social", "Discipline", "Determination"]
    task_ids = []
    
    for category in categories:
        task_id = tester.test_create_task(category, f"Test {category} Task")
        if task_id:
            task_ids.append(task_id)
    
    if not tester.test_get_tasks():
        print("❌ Get tasks failed")
    
    # Test task operations
    if task_ids:
        first_task_id = task_ids[0]
        
        if not tester.test_update_task(first_task_id):
            print("❌ Update task failed")
            
        if not tester.test_complete_task(first_task_id):
            print("❌ Complete task failed")
    
    # Test task category limit
    if not tester.test_task_category_limit():
        print("❌ Task category limit test failed")
    
    # Test Stats and Leaderboard
    print("\n📊 STATS AND LEADERBOARD TESTS")
    print("-" * 30)
    
    if not tester.test_radar_stats():
        print("❌ Radar stats failed")
        
    if not tester.test_leaderboard():
        print("❌ Leaderboard failed")
        
    if not tester.test_leaderboard_with_language_filter():
        print("❌ Leaderboard with language filter failed")
    
    # Test Quote Management
    print("\n💬 QUOTE MANAGEMENT TESTS")
    print("-" * 30)
    
    if not tester.test_save_favorite_quote():
        print("❌ Save favorite quote failed")
        
    if not tester.test_get_favorite_quotes():
        print("❌ Get favorite quotes failed")
    
    # Clean up - delete created tasks
    print("\n🧹 CLEANUP")
    print("-" * 30)
    
    for task_id in tester.created_tasks[1:]:  # Keep first task for completion test
        tester.test_delete_task(task_id)
    
    # Print final results
    print("\n" + "=" * 50)
    print(f"📊 FINAL RESULTS: {tester.tests_passed}/{tester.tests_run} tests passed")
    
    if tester.tests_passed == tester.tests_run:
        print("🎉 All tests passed!")
        return 0
    else:
        print(f"❌ {tester.tests_run - tester.tests_passed} tests failed")
        return 1

if __name__ == "__main__":
    sys.exit(main())