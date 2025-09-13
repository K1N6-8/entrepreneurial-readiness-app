class EntrepreneurialChatbot {
    constructor() {
        this.currentScenario = null;
        this.completedScenarios = 0;
        this.scenarioTypes = new Set();
        this.scenarioLog = []; // Store previous scenarios and scores
        this.conversationQuestions = this.initializeConversationQuestions();
        this.conversationContext = 'general'; // Track conversation context
        
        this.initializeElements();
        this.bindEvents();
        this.updateStats();
    }
    
    initializeElements() {
        this.chatMessages = document.getElementById('chat-messages');
        this.ratingPanel = document.getElementById('rating-panel');
        this.readinessScore = document.getElementById('readiness-score');
        this.scoreDisplay = document.getElementById('score-display');
        this.statusMessage = document.getElementById('status-message');
        this.loading = document.getElementById('loading');
        this.completedCount = document.getElementById('completed-count');
        this.typesCount = document.getElementById('types-count');
        this.userMessageInput = document.getElementById('user-message');
        this.sendMessageBtn = document.getElementById('send-message');
    }
    
    bindEvents() {
        document.getElementById('start-btn').addEventListener('click', () => {
            this.generateNewScenario();
        });
        
        document.getElementById('new-scenario').addEventListener('click', () => {
            this.generateNewScenario();
        });
        
        document.getElementById('submit-rating').addEventListener('click', () => {
            this.submitRating();
        });
        
        document.getElementById('skip-scenario').addEventListener('click', () => {
            this.generateNewScenario();
        });
        
        document.getElementById('export-data').addEventListener('click', () => {
            this.exportData();
        });
        
        
        this.readinessScore.addEventListener('input', (e) => {
            this.scoreDisplay.textContent = e.target.value;
        });

        // Chat input event handlers
        this.sendMessageBtn.addEventListener('click', () => {
            this.handleUserMessage();
        });

        this.userMessageInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.handleUserMessage();
            }
        });
    }
    
    async generateNewScenario() {
        try {
            // Log previous scenario if exists
            if (this.currentScenario && this.readinessScore.value) {
                this.logPreviousScenario();
            }

            this.showLoading('Generating new scenario...');
            this.hideRatingPanel();
            
            const response = await fetch('/generate_scenario');
            const scenario = await response.json();
            
            this.currentScenario = scenario;
            this.displayScenario(scenario);
            this.showRatingPanel();
            
            this.hideLoading();
            this.setStatus('Rate the entrepreneurial readiness for this scenario');
        } catch (error) {
            this.showError('Failed to generate scenario. Please try again.');
            this.hideLoading();
        }
    }
    
    displayScenario(scenario) {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'bot-message scenario-message';
        
        const formatMoney = (amount) => {
            if (amount === 0) return '$0';
            return new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: 'USD',
                minimumFractionDigits: 0,
                maximumFractionDigits: 0
            }).format(amount);
        };
        
        messageDiv.innerHTML = `
            <div class="message-content">
                <h3>📋 New Scenario: ${this.formatScenarioType(scenario.scenario_type)}</h3>
                <p><em>${scenario.description}</em></p>
                <div class="scenario-details">
                    <div class="detail-item">
                        <span class="detail-label">💰 Savings:</span>
                        <span class="detail-value">${formatMoney(scenario.savings_amount)}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">📊 Monthly Income:</span>
                        <span class="detail-value">${formatMoney(scenario.monthly_income)}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">📋 Monthly Expenses:</span>
                        <span class="detail-value">${formatMoney(scenario.monthly_expenses)}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">🎮 Entertainment:</span>
                        <span class="detail-value">${formatMoney(scenario.monthly_entertainment)}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">🤝 Sales Skills:</span>
                        <span class="detail-value">${scenario.sales_skills}/10</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">⚡ Risk Level:</span>
                        <span class="detail-value">${scenario.risk_level}/10</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">👤 Age:</span>
                        <span class="detail-value">${scenario.age} years</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">👨‍👩‍👧‍👦 Dependents:</span>
                        <span class="detail-value">${scenario.dependents} people</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">🏠 Assets:</span>
                        <span class="detail-value">${formatMoney(scenario.assets)}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">💪 Confidence:</span>
                        <span class="detail-value">${scenario.confidence}/10</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">🎯 Idea Difficulty:</span>
                        <span class="detail-value">${scenario.difficulty}/10</span>
                    </div>
                </div>
            </div>
        `;
        
        this.chatMessages.appendChild(messageDiv);
        this.scrollToBottom();
    }
    
    formatScenarioType(type) {
        return type.split('_').map(word => 
            word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' ');
    }
    
    async submitRating() {
        if (!this.currentScenario) {
            this.showError('No scenario to rate');
            return;
        }
        
        try {
            this.showLoading('Submitting rating...');
            
            const rating = parseInt(this.readinessScore.value);
            
            const submissionData = {
                savings_amount: this.currentScenario.savings_amount,
                monthly_income: this.currentScenario.monthly_income,
                monthly_expenses: this.currentScenario.monthly_expenses,
                monthly_entertainment: this.currentScenario.monthly_entertainment,
                sales_skills: this.currentScenario.sales_skills,
                risk_level: this.currentScenario.risk_level,
                age: this.currentScenario.age,
                dependents: this.currentScenario.dependents,
                assets: this.currentScenario.assets,
                confidence: this.currentScenario.confidence,
                difficulty: this.currentScenario.difficulty,
                scenario_type: this.currentScenario.scenario_type,
                entrepreneurial_readiness_score: rating
            };
            
            // Debug: Log what we're actually sending
            console.log('Current scenario:', this.currentScenario);
            console.log('Submission data:', submissionData);
            console.log('Submission data keys:', Object.keys(submissionData));
            
            const response = await fetch('/submit_rating', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(submissionData)
            });
            
            const result = await response.json();
            
            if (result.status === 'success') {
                this.completedScenarios++;
                this.scenarioTypes.add(this.currentScenario.scenario_type);
                this.updateStats();
                
                this.showSuccess(`Rating submitted! Score: ${rating}/10`);
                this.hideRatingPanel();
                
                // Auto-generate next scenario after a short delay
                setTimeout(() => {
                    this.generateNewScenario();
                }, 1500);
            } else {
                this.showError('Failed to submit rating');
            }
            
            this.hideLoading();
        } catch (error) {
            this.showError('Failed to submit rating. Please try again.');
            this.hideLoading();
        }
    }
    
    async exportData() {
        try {
            this.showLoading('Uploading data to Hugging Face dataset...');
            
            const response = await fetch('/export_data');
            const result = await response.json();
            
            if (result.status === 'success') {
                let message = `Successfully exported ${result.record_count} records`;
                
                // Add Hugging Face status
                if (result.huggingface_status === 'success') {
                    message += `\n✅ Data uploaded to Hugging Face dataset!`;
                    this.showSuccess(message);
                } else if (result.huggingface_status === 'no_token') {
                    message += `\n⚠️ ${result.huggingface_message}`;
                    this.showSuccess(message);
                } else if (result.huggingface_status === 'failed') {
                    message += `\n❌ ${result.huggingface_message}`;
                    this.showSuccess(message);
                } else {
                    this.showSuccess(message);
                }
            } else {
                this.showError('Failed to export data');
            }
            
            this.hideLoading();
        } catch (error) {
            this.showError('Failed to export data. Please try again.');
            this.hideLoading();
        }
    }
    
    updateStats() {
        this.completedCount.textContent = this.completedScenarios;
        this.typesCount.textContent = this.scenarioTypes.size;
    }
    
    showRatingPanel() {
        this.ratingPanel.style.display = 'block';
        // Reset rating to middle value
        this.readinessScore.value = 5;
        this.scoreDisplay.textContent = '5';
    }
    
    hideRatingPanel() {
        this.ratingPanel.style.display = 'none';
    }
    
    showLoading(message) {
        this.statusMessage.textContent = message;
        this.loading.style.display = 'flex';
    }
    
    hideLoading() {
        this.loading.style.display = 'none';
    }
    
    setStatus(message) {
        this.statusMessage.textContent = message;
    }
    
    showSuccess(message) {
        const successDiv = document.createElement('div');
        successDiv.className = 'success-message';
        successDiv.textContent = message;
        
        this.chatMessages.appendChild(successDiv);
        this.scrollToBottom();
        
        // Remove after 3 seconds
        setTimeout(() => {
            if (successDiv.parentNode) {
                successDiv.parentNode.removeChild(successDiv);
            }
        }, 3000);
    }
    
    showError(message) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.textContent = message;
        
        this.chatMessages.appendChild(errorDiv);
        this.scrollToBottom();
        
        // Remove after 5 seconds
        setTimeout(() => {
            if (errorDiv.parentNode) {
                errorDiv.parentNode.removeChild(errorDiv);
            }
        }, 5000);
    }
    
    scrollToBottom() {
        this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
    }

    // Conversation and Tips Methods
    handleUserMessage() {
        const message = this.userMessageInput.value.trim();
        if (!message) return;

        // Display user message
        this.displayUserMessage(message);
        this.userMessageInput.value = '';

        // Process the message
        if (message.toLowerCase().includes('scenario') || message.toLowerCase().includes('new')) {
            this.generateNewScenario();
        } else {
            this.respondToUserMessage(message);
        }
    }

    displayUserMessage(message) {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'user-message';
        messageDiv.textContent = message;
        this.chatMessages.appendChild(messageDiv);
        this.scrollToBottom();
    }

    respondToUserMessage(message) {
        const response = this.generateConversationalResponse(message);
        this.displayBotQuestion(response);
    }

    generateConversationalResponse(message) {
        const lowerMessage = message.toLowerCase();
        
        // Analyze user's message and respond contextually
        if (lowerMessage.includes('yes') || lowerMessage.includes('no') || lowerMessage.includes('maybe')) {
            return this.getFollowUpQuestion(message);
        } else if (lowerMessage.includes('money') || lowerMessage.includes('funding') || lowerMessage.includes('capital')) {
            this.conversationContext = 'funding';
            return this.getRandomQuestion('funding');
        } else if (lowerMessage.includes('risk') || lowerMessage.includes('afraid') || lowerMessage.includes('scared')) {
            this.conversationContext = 'risk';
            return this.getRandomQuestion('risk');
        } else if (lowerMessage.includes('skill') || lowerMessage.includes('experience') || lowerMessage.includes('learn')) {
            this.conversationContext = 'skills';
            return this.getRandomQuestion('skills');
        } else if (lowerMessage.includes('business') || lowerMessage.includes('start') || lowerMessage.includes('idea')) {
            this.conversationContext = 'business';
            return this.getRandomQuestion('business');
        } else if (lowerMessage.includes('market') || lowerMessage.includes('customer') || lowerMessage.includes('sell')) {
            this.conversationContext = 'market';
            return this.getRandomQuestion('market');
        } else if (lowerMessage.includes('help') || lowerMessage.includes('hello') || lowerMessage.includes('hi')) {
            return this.getWelcomeQuestion();
        } else {
            return this.getRandomQuestion('general');
        }
    }

    getRandomQuestion(category) {
        const questions = this.conversationQuestions[category] || this.conversationQuestions.general;
        return questions[Math.floor(Math.random() * questions.length)];
    }

    getFollowUpQuestion(userResponse) {
        const followUps = this.conversationQuestions.followUps;
        return followUps[Math.floor(Math.random() * followUps.length)];
    }

    getWelcomeQuestion() {
        const welcomes = this.conversationQuestions.welcome;
        return welcomes[Math.floor(Math.random() * welcomes.length)];
    }

    displayBotQuestion(question) {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'bot-message';
        messageDiv.innerHTML = `
            <div class="message-content">
                <p>${question}</p>
            </div>
        `;
        this.chatMessages.appendChild(messageDiv);
        this.scrollToBottom();
    }

    logPreviousScenario() {
        if (this.currentScenario) {
            const logEntry = {
                scenario: this.currentScenario,
                score: parseInt(this.readinessScore.value),
                timestamp: new Date().toLocaleString()
            };
            this.scenarioLog.push(logEntry);

            // Display log message
            this.displayScenarioLog(logEntry);
        }
    }

    displayScenarioLog(logEntry) {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'log-message';
        messageDiv.innerHTML = `
            <strong>📝 Scenario Logged:</strong> ${this.formatScenarioType(logEntry.scenario.scenario_type)} 
            - Score: ${logEntry.score}/10 at ${logEntry.timestamp}
        `;
        this.chatMessages.appendChild(messageDiv);
        this.scrollToBottom();
    }

    initializeConversationQuestions() {
        return {
            welcome: [
                "Hi there! I'm here to help you explore your entrepreneurial readiness. What's been on your mind about starting a business lately?",
                "Hello! I'm your entrepreneurial readiness assistant. What aspect of entrepreneurship are you most curious or concerned about?",
                "Welcome! I'd love to help you think through your entrepreneurial journey. What's your biggest question about starting a business?",
                "Hey! Ready to dive into some entrepreneurial self-reflection? What's driving your interest in starting a business?"
            ],
            funding: [
                "How much of your own money would you be willing to invest in a business idea you truly believe in?",
                "What's your current savings situation, and how comfortable are you with potentially losing some of that money?",
                "Have you ever considered taking on investors or business partners to fund your startup dreams?",
                "If you had to bootstrap a business with just $1,000, what type of business would you start?",
                "How do you feel about the idea of taking out a business loan or using credit to fund your startup?"
            ],
            risk: [
                "On a scale of 1-10, how comfortable are you with uncertainty and not knowing if your business will succeed?",
                "What's the biggest professional risk you've ever taken, and how did it turn out?",
                "How would you handle it emotionally if your business failed after two years of hard work?",
                "What's more important to you - a steady paycheck or the potential for unlimited earning?",
                "If you knew there was a 70% chance of failure, would you still start a business? Why or why not?"
            ],
            skills: [
                "What's one skill you have that you think would be really valuable in running a business?",
                "How comfortable are you with selling something you believe in to people who need it?",
                "What's a skill you know you'd need to develop to be successful as an entrepreneur?",
                "Have you ever had to learn something completely new for work? How did you approach it?",
                "Do you prefer doing everything yourself or building a team to handle different parts of the business?"
            ],
            business: [
                "What problem in your daily life have you thought 'someone should really solve this'?",
                "If you started a business tomorrow, who would be your very first customer and why would they buy from you?",
                "What's more exciting to you - creating something completely new or improving something that already exists?",
                "How do you typically handle it when your plans don't work out as expected?",
                "If you could start any business right now with guaranteed success, what would it be and why?"
            ],
            market: [
                "How well do you think you understand what people in your area or industry really want?",
                "Have you ever tried to sell something, even informally? How did that experience go?",
                "What would you do if you discovered someone else was already doing exactly what you wanted to do?",
                "How important is it to you to be first to market versus being better than what's already out there?",
                "What's one thing you wish existed in the marketplace that you've never been able to find?"
            ],
            general: [
                "What motivates you more - building something meaningful or achieving financial freedom?",
                "How do you typically handle stress and pressure when things get challenging?",
                "What would success look like to you if you started your own business?",
                "Are you more energized by working alone or collaborating with others on big projects?",
                "What's one thing about your current work situation that makes you think about entrepreneurship?"
            ],
            followUps: [
                "That's interesting! Can you tell me more about what drives that feeling?",
                "I can see where you're coming from. What do you think has shaped that perspective for you?",
                "That's a great point. How do you think that would affect your approach to running a business?",
                "Thanks for sharing that. What would need to change for you to feel more confident about it?",
                "That makes sense. Have you always felt that way, or is this something that's developed over time?",
                "Interesting perspective! What experiences have led you to think about it that way?",
                "I hear you. What would it take for you to feel ready to take that next step?",
                "That's really thoughtful. How do you think other people in your situation typically handle this?"
            ]
        };
    }
}

// Initialize the chatbot when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new EntrepreneurialChatbot();
});
