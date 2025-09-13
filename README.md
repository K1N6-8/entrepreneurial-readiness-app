# 💼 Entrepreneurial Readiness Chatbot App

This is a web-based chatbot app that generates entrepreneurial scenarios and asks users to rate how "prepared" they think a person with that scenario would be. The collected data is exported to Hugging Face as a tabular dataset containing the inputs and the user's own scores. 

## 🚀 Live Demo

👉 [Click here to use the app](https://entrepreneurial-readiness-app.onrender.com)  

---

## 🧠 How It Works

- Randomly generates a scenario with values like:
  - Savings, income, expenses, assets
  - Confidence, risk level, sales skills
  - Difficulty of business idea
- Users rate their readiness on a 0–10 scale
- Ratings + data are saved and can be exported as CSV
- Exports directly to [Hugging Face Datasets](https://huggingface.co/datasets/King-8/entrepreneur-chatbot-data)

---

## 🗂️ File Structure

├── main.py # Flask backend (API + logic)
├── requirements.txt # Python dependencies
├── templates/
│ └── index.html # Frontend HTML
├── static/
│ ├── css/
│ │ └── style.css # App styling
│ └── js/
│ └── app.js # App functionality
└── entrepreneur_data.csv # Sample dataset (for testing)

---

## 🔧 Technologies Used

- **Python** + **Flask** (Backend)
- **HTML/CSS/JS** (Frontend)
- **Hugging Face Hub** (Dataset storage)
- **Render** (Deployment)
- **GitHub** (Version control)

---

## 📦 Dataset Features

Each row includes:

| Feature                     | Description                                |
|----------------------------|--------------------------------------------|
| savings_amount             | Total personal savings                     |
| monthly_income             | Regular monthly income                     |
| monthly_expenses           | Recurring monthly bills                    |
| monthly_entertainment      | Spending on fun or leisure                 |
| sales_skills               | Sales/communication skill level (0–10)     |
| risk_level                 | Risk-taking attitude (0–10)                |
| age                        | Age of the individual                      |
| dependents                 | Number of dependents                       |
| assets                     | Total financial assets (in dollars)        |
| confidence                 | Self-confidence level (0–10)               |
| difficulty_of_business_idea| Challenge level of business idea (0–10)    |
| entrepreneurial_readiness  | User-rated readiness score (0–10)          |

---

## 🌟 Acknowledgments

- Hugging Face team for open-source ML tools  
- Coding in Color / Mayor's Youth at Work Internship  
- ChatGPT for technical support and encouragement 💬✨
