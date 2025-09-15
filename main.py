from flask import Flask, render_template, request, jsonify, send_file
import csv
import os
import random
import pandas as pd
from datetime import datetime
from huggingface_hub import HfApi, create_repo
import io

app = Flask(__name__)

# Global data storage
chat_data = []

# Scenario types and their characteristics
SCENARIO_TYPES = {
    "overspender": {
        "description":
        "Someone who spends more on entertainment than their income",
        "entertainment_factor":
        lambda income: income * random.uniform(1.1, 2.5)
    },
    "high_bills_low_savings": {
        "description":
        "High monthly expenses compared to savings",
        "expenses_factor":
        lambda savings: max(savings * random.uniform(1.2, 3.0), 100)
    },
    "high_savings_low_income": {
        "description": "Older person living off savings/assets",
        "age_range": (55, 75),
        "income_factor": 0.3,
        "savings_factor": 5.0
    },
    "young_starter": {
        "description":
        "Very low income/assets, but high confidence and skills",
        "age_range": (18, 28),
        "confidence_range": (7, 10),
        "skills_range": (6, 10),
        "income_max": 2500,
        "assets_max": 5000
    },
    "wealthy_insecure": {
        "description": "Very high income/assets, but low confidence score",
        "confidence_range": (1, 4),
        "income_min": 8000,
        "assets_min": 100000
    },
    "high_difficulty": {
        "description": "Promising business idea but very difficult",
        "difficulty_range": (8, 10)
    },
    "bootstrapper": {
        "description":
        "Very little money, but strong belief and risk tolerance",
        "savings_max": 1000,
        "confidence_range": (7, 10),
        "risk_range": (7, 10)
    },
    "investor_backed": {
        "description":
        "High assets and savings, but poor sales skills/confidence",
        "assets_min": 50000,
        "savings_min": 20000,
        "skills_range": (1, 4),
        "confidence_range": (2, 5)
    },
    "high_earner_no_savings": {
        "description":
        "Large monthly income but nearly all goes to expenses/entertainment",
        "income_min": 6000,
        "savings_max": 2000
    },
    "frugal_planner": {
        "description":
        "Modest income, low entertainment spending, consistently saving",
        "entertainment_factor": 0.1,
        "expenses_factor": 0.6
    },
    "family_pressure": {
        "description":
        "Several dependents, low confidence, but strong income/assets",
        "dependents_min": 3,
        "confidence_range": (2, 5),
        "income_min": 4000,
        "assets_min": 15000
    },
    "young_risk_taker": {
        "description":
        "Very young, low savings, but extremely high risk tolerance and confidence",
        "age_range": (18, 25),
        "savings_max": 3000,
        "risk_range": (8, 10),
        "confidence_range": (8, 10)
    },
    "older_cautious": {
        "description": "Older age, steady savings, but low risk level",
        "age_range": (45, 65),
        "savings_min": 15000,
        "risk_range": (1, 3)
    },
    "serial_dreamer": {
        "description":
        "High idea difficulty, low confidence, lots of dependents",
        "difficulty_range": (7, 10),
        "confidence_range": (2, 5),
        "dependents_min": 2
    },
    "hidden_gem": {
        "description":
        "Small savings, average income, but unusually strong sales skills + high confidence",
        "savings_max": 8000,
        "income_range": (2500, 4500),
        "skills_range": (8, 10),
        "confidence_range": (7, 10)
    },
    "lottery_winner": {
        "description":
        "Massive sudden savings/assets, no sales skills, low confidence",
        "savings_min": 500000,
        "assets_min": 800000,
        "skills_range": (1, 3),
        "confidence_range": (1, 4)
    }
}


def generate_random_scenario():
    """Generate a random entrepreneurial scenario with diverse values"""
    scenario_type = random.choice(list(SCENARIO_TYPES.keys()))
    scenario_info = SCENARIO_TYPES[scenario_type]

    # Base ranges for all variables
    savings_amount = random.choice([0, 0, 0] + list(range(100, 50000, 100)) +
                                   list(range(50000, 1000000, 10000)))
    monthly_income = random.choice([0, 0] + list(range(500, 15000, 100)) +
                                   list(range(15000, 100000, 1000)))
    monthly_expenses = random.randint(200, 8000)
    monthly_entertainment = random.randint(0, 3000)
    sales_skills = random.randint(0, 10)
    risk_level = random.randint(0, 10)
    age = random.randint(18, 70)
    dependents = random.randint(0, 8)
    assets = random.choice([0, 0, 0] + list(range(1000, 100000, 1000)) +
                           list(range(100000, 5000000, 50000)))
    confidence = random.randint(0, 10)
    difficulty = random.randint(1, 10)

    # Apply scenario-specific modifications
    if scenario_type == "overspender":
        monthly_entertainment = int(monthly_income * random.uniform(
            1.1, 2.5)) if monthly_income > 0 else random.randint(1000, 5000)
    elif scenario_type == "high_bills_low_savings":
        monthly_expenses = max(int(savings_amount * random.uniform(1.2, 3.0)),
                               100) if savings_amount > 0 else random.randint(
                                   3000, 8000)
    elif scenario_type == "high_savings_low_income":
        age = random.randint(55, 75)
        monthly_income = int(monthly_income *
                             0.3) if monthly_income > 0 else random.randint(
                                 500, 2000)
        savings_amount = max(savings_amount, random.randint(50000, 500000))
    elif scenario_type == "young_starter":
        age = random.randint(18, 28)
        confidence = random.randint(7, 10)
        sales_skills = random.randint(6, 10)
        monthly_income = min(monthly_income, 2500)
        assets = min(assets, 5000)
    elif scenario_type == "wealthy_insecure":
        confidence = random.randint(1, 4)
        monthly_income = max(monthly_income, 8000)
        assets = max(assets, 100000)
    elif scenario_type == "high_difficulty":
        difficulty = random.randint(8, 10)
    elif scenario_type == "bootstrapper":
        savings_amount = min(savings_amount, 1000)
        confidence = random.randint(7, 10)
        risk_level = random.randint(7, 10)
    elif scenario_type == "investor_backed":
        assets = max(assets, 50000)
        savings_amount = max(savings_amount, 20000)
        sales_skills = random.randint(1, 4)
        confidence = random.randint(2, 5)
    elif scenario_type == "high_earner_no_savings":
        monthly_income = max(monthly_income, 6000)
        savings_amount = min(savings_amount, 2000)
        monthly_expenses = int(monthly_income * 0.7)
        monthly_entertainment = int(monthly_income * 0.25)
    elif scenario_type == "frugal_planner":
        monthly_entertainment = int(
            monthly_income *
            0.1) if monthly_income > 0 else random.randint(50, 200)
        monthly_expenses = int(monthly_income *
                               0.6) if monthly_income > 0 else random.randint(
                                   1000, 3000)
    elif scenario_type == "family_pressure":
        dependents = max(dependents, 3)
        confidence = random.randint(2, 5)
        monthly_income = max(monthly_income, 4000)
        assets = max(assets, 15000)
    elif scenario_type == "young_risk_taker":
        age = random.randint(18, 25)
        savings_amount = min(savings_amount, 3000)
        risk_level = random.randint(8, 10)
        confidence = random.randint(8, 10)
    elif scenario_type == "older_cautious":
        age = random.randint(45, 65)
        savings_amount = max(savings_amount, 15000)
        risk_level = random.randint(1, 3)
    elif scenario_type == "serial_dreamer":
        difficulty = random.randint(7, 10)
        confidence = random.randint(2, 5)
        dependents = max(dependents, 2)
    elif scenario_type == "hidden_gem":
        savings_amount = min(savings_amount, 8000)
        monthly_income = random.randint(2500, 4500)
        sales_skills = random.randint(8, 10)
        confidence = random.randint(7, 10)
    elif scenario_type == "lottery_winner":
        savings_amount = max(savings_amount, 500000)
        assets = max(assets, 800000)
        sales_skills = random.randint(1, 3)
        confidence = random.randint(1, 4)

    # Round monetary values
    def round_money(value):
        if value == 0:
            return 0
        elif value < 100:
            return round(value, -1)  # Round to nearest 10
        elif value < 1000:
            return round(value, -2)  # Round to nearest 100
        else:
            return round(value, -3)  # Round to nearest 1000

    return {
        "scenario_type": scenario_type,
        "description": scenario_info["description"],
        "savings_amount": round_money(savings_amount),
        "monthly_income": round_money(monthly_income),
        "monthly_expenses": round_money(monthly_expenses),
        "monthly_entertainment": round_money(monthly_entertainment),
        "sales_skills": sales_skills,
        "risk_level": risk_level,
        "age": age,
        "dependents": dependents,
        "assets": round_money(assets),
        "confidence": confidence,
        "difficulty": difficulty
    }


@app.route('/')
def index():
    return render_template('index.html')


@app.route('/generate_scenario', methods=['GET'])
def generate_scenario():
    """Generate a new random scenario"""
    scenario = generate_random_scenario()
    return jsonify(scenario)


@app.route('/submit_rating', methods=['POST'])
def submit_rating():
    """Store the user's rating for the scenario"""
    data = request.json

    # Store in global data
    chat_data.append(data)

    return jsonify({
        "status": "success",
        "message": "Rating submitted successfully!"
    })


@app.route('/export_data', methods=['GET'])
def export_data():
    """Export all chat data to a single CSV and upload to Hugging Face (append mode)"""
    if not chat_data:
        return jsonify({"status": "error", "message": "No data to export"})

    fieldnames = [
        'savings_amount', 'monthly_income', 'monthly_expenses',
        'monthly_entertainment', 'sales_skills', 'risk_level', 'age',
        'dependents', 'assets', 'confidence', 'difficulty_of_business_idea',
        'entrepreneurial_readiness'
    ]

    new_df = pd.DataFrame([{
        'savings_amount': row.get('savings_amount', ''),
        'monthly_income': row.get('monthly_income', ''),
        'monthly_expenses': row.get('monthly_expenses', ''),
        'monthly_entertainment': row.get('monthly_entertainment', ''),
        'sales_skills': row.get('sales_skills', ''),
        'risk_level': row.get('risk_level', ''),
        'age': row.get('age', ''),
        'dependents': row.get('dependents', ''),
        'assets': row.get('assets', ''),
        'confidence': row.get('confidence', ''),
        'difficulty_of_business_idea': row.get('difficulty', ''),
        'entrepreneurial_readiness': row.get('entrepreneurial_readiness_score', '')
    } for row in chat_data])

    # Try downloading existing file
    csv_filename = 'entrepreneur_data.csv'
    try:
        hf_token = os.getenv('HUGGINGFACE_TOKEN')
        repo_id = "King-8/entrepreneur-chatbot-data"
        hf_api = HfApi(token=hf_token)

        # Download current file
        existing_file = hf_api.download_repo_file(
            repo_id=repo_id,
            path_in_repo=csv_filename,
            repo_type="dataset",
            token=hf_token
        )
        existing_df = pd.read_csv(existing_file)
        combined_df = pd.concat([existing_df, new_df], ignore_index=True)
    except Exception as e:
        # If download fails, just use new data
        combined_df = new_df

    # Save combined data
    combined_df.to_csv(csv_filename, index=False)

    # Upload to Hugging Face
    hf_status = "not_attempted"
    hf_message = ""
    try:
        hf_api.upload_file(
            path_or_fileobj=csv_filename,
            path_in_repo=csv_filename,
            repo_id=repo_id,
            repo_type="dataset",
            commit_message=f"Appended {len(new_df)} new rows"
        )
        hf_status = "success"
        hf_message = f"Uploaded to {repo_id} with {len(combined_df)} total rows"
    except Exception as e:
        hf_status = "error"
        hf_message = str(e)

    return jsonify({
        "status": "success",
        "record_count": len(combined_df),
        "huggingface_status": hf_status,
        "huggingface_message": hf_message
    })



if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
