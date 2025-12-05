import pyodbc
import os
import json
from typing import List, Dict, Any

class DatabaseConnection:
    def __init__(self):
        self.connection_string = self._get_connection_string()
    
    def _get_connection_string(self) -> str:
        """Get database connection string from environment variables"""
        server = os.environ.get('DB_SERVER', 'your-server.database.windows.net')
        database = os.environ.get('DB_DATABASE', 'tmaportal')
        username = os.environ.get('DB_USERNAME', 'kaizen_app_user')
        password = os.environ.get('DB_PASSWORD', 'Volvo2026#Secure$')
        
        return f"DRIVER={{ODBC Driver 18 for SQL Server}};SERVER={server};DATABASE={database};UID={username};PWD={password};Encrypt=yes;TrustServerCertificate=no;Connection Timeout=30;"
    
    def execute_query(self, query: str, params: tuple = None) -> List[Dict[str, Any]]:
        """Execute SELECT query and return results as list of dictionaries"""
        try:
            with pyodbc.connect(self.connection_string) as conn:
                cursor = conn.cursor()
                
                if params:
                    cursor.execute(query, params)
                else:
                    cursor.execute(query)
                
                columns = [column[0] for column in cursor.description]
                results = []
                
                for row in cursor.fetchall():
                    results.append(dict(zip(columns, row)))
                
                return results
                
        except Exception as e:
            raise Exception(f"Database query error: {str(e)}")
    
    def execute_non_query(self, query: str, params: tuple = None) -> int:
        """Execute INSERT/UPDATE/DELETE query and return affected rows"""
        try:
            with pyodbc.connect(self.connection_string) as conn:
                cursor = conn.cursor()
                
                if params:
                    cursor.execute(query, params)
                else:
                    cursor.execute(query)
                
                conn.commit()
                return cursor.rowcount
                
        except Exception as e:
            raise Exception(f"Database execution error: {str(e)}")
    
    def execute_scalar(self, query: str, params: tuple = None) -> Any:
        """Execute query and return single value"""
        try:
            with pyodbc.connect(self.connection_string) as conn:
                cursor = conn.cursor()
                
                if params:
                    cursor.execute(query, params)
                else:
                    cursor.execute(query)
                
                result = cursor.fetchone()
                return result[0] if result else None
                
        except Exception as e:
            raise Exception(f"Database scalar error: {str(e)}")

# Global database instance
db = DatabaseConnection()