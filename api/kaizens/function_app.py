import azure.functions as func
import json
import logging
import sys
import os

# Add the parent directory to the path to import shared modules
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))
from shared.database import db

app = func.FunctionApp()

@app.route(route="kaizens", methods=["GET"], auth_level=func.AuthLevel.ANONYMOUS)
def get_kaizens(req: func.HttpRequest) -> func.HttpResponse:
    """Get all kaizens with pagination and filtering"""
    
    try:
        # Get query parameters
        page = int(req.params.get('page', 1))
        limit = int(req.params.get('limit', 10))
        status = req.params.get('status', '')
        department = req.params.get('department', '')
        
        # Calculate offset
        offset = (page - 1) * limit
        
        # Build WHERE clause
        where_conditions = []
        params = []
        
        if status:
            where_conditions.append("k.Status = ?")
            params.append(status)
            
        if department:
            where_conditions.append("d.DepartmentName = ?")
            params.append(department)
        
        where_clause = "WHERE " + " AND ".join(where_conditions) if where_conditions else ""
        
        # Main query
        query = f"""
        SELECT 
            k.ID,
            k.KaizenNumber,
            kt.TypeName,
            d.DepartmentName,
            k.ApplicationArea,
            k.Leader,
            k.Team,
            s.CategoryName as SQDCEPCategory,
            k.ProblemDescription,
            k.ImprovementDescription,
            k.Results,
            k.Cost,
            k.Benefit,
            k.CostBenefitRatio,
            k.IsStandardized,
            k.Status,
            k.SubmittedDate,
            k.CompletedDate,
            k.CreatedBy,
            k.CreatedAt,
            COUNT(ap.ID) as ActionCount
        FROM Kaizens k
            INNER JOIN KaizenTypes kt ON k.TypeID = kt.ID
            INNER JOIN Departments d ON k.DepartmentID = d.ID
            INNER JOIN SQDCEPCategories s ON k.SQDCEPCategoryID = s.ID
            LEFT JOIN ActionPlans ap ON k.ID = ap.KaizenID
        {where_clause}
        GROUP BY k.ID, k.KaizenNumber, kt.TypeName, d.DepartmentName, k.ApplicationArea, 
                 k.Leader, k.Team, s.CategoryName, k.ProblemDescription, k.ImprovementDescription,
                 k.Results, k.Cost, k.Benefit, k.CostBenefitRatio, k.IsStandardized, k.Status,
                 k.SubmittedDate, k.CompletedDate, k.CreatedBy, k.CreatedAt
        ORDER BY k.CreatedAt DESC
        OFFSET ? ROWS FETCH NEXT ? ROWS ONLY
        """
        
        # Add pagination parameters
        params.extend([offset, limit])
        
        # Execute query
        kaizens = db.execute_query(query, tuple(params))
        
        # Get total count
        count_query = f"""
        SELECT COUNT(DISTINCT k.ID) as Total
        FROM Kaizens k
            INNER JOIN KaizenTypes kt ON k.TypeID = kt.ID
            INNER JOIN Departments d ON k.DepartmentID = d.ID
            INNER JOIN SQDCEPCategories s ON k.SQDCEPCategoryID = s.ID
        {where_clause}
        """
        
        count_params = params[:-2] if where_conditions else []
        total_count = db.execute_scalar(count_query, tuple(count_params))
        
        # Format dates for JSON serialization
        for kaizen in kaizens:
            for date_field in ['SubmittedDate', 'CompletedDate', 'CreatedAt']:
                if kaizen.get(date_field):
                    kaizen[date_field] = kaizen[date_field].isoformat()
        
        # Response
        response_data = {
            "kaizens": kaizens,
            "pagination": {
                "page": page,
                "limit": limit,
                "total": total_count,
                "pages": (total_count + limit - 1) // limit
            }
        }
        
        return func.HttpResponse(
            json.dumps(response_data, default=str),
            status_code=200,
            headers={"Content-Type": "application/json"}
        )
        
    except Exception as e:
        logging.error(f"Error in get_kaizens: {str(e)}")
        return func.HttpResponse(
            json.dumps({"error": str(e)}),
            status_code=500,
            headers={"Content-Type": "application/json"}
        )