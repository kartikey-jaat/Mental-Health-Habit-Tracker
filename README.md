🧠 Mindful Moments
Mental Wellness & Habit Tracking Web Application

Mindful Moments is a modern, responsive, client-side web application designed to help users track their daily mood, maintain journal entries, and build consistent habits.

The application focuses on simplicity, privacy, and usability, enabling users to reflect on their mental well-being without relying on external services or data storage.

🚀 Overview

Mindful Moments provides a unified platform where users can:

Record daily emotions and thoughts
Maintain a structured journaling habit
Track personal habits and consistency
Monitor progress through meaningful statistics

All data is stored locally, ensuring complete privacy and offline accessibility.

✨ Core Features
📝 Mood Tracking & Journaling
Emoji-based mood selection system
Daily journal entry logging
Timestamped entries with sorting options
Mood-based filtering
✅ Habit Tracking System
Add and manage custom habits
Mark habits as completed
Filter habits (All / Active / Completed)
Delete habits with confirmation
📊 Analytics & Insights
Total number of journal entries
Daily streak tracking
Habit completion percentage
Average mood score
🎨 User Experience
Responsive design (mobile + desktop)
Smooth animations and transitions
Accessible interface with ARIA support
Real-time notification system
🌙 Theme Support
Light and Dark mode toggle
System preference detection
💾 Data Management
Export data as JSON
Import previously saved data
Clear all stored data
⚖️ Advantages & Limitations
✅ Advantages
Privacy-Centric Design
No external servers or APIs — all data remains on the user’s device.
Lightweight & Efficient
Built using pure HTML, CSS, and JavaScript without heavy frameworks.
Offline Functionality
Fully usable without an internet connection.
Clean & Intuitive UI
Focused on usability with modern design principles.
Cross-Device Compatibility
Responsive layout supports multiple screen sizes.
Data Portability
Easy backup and restore via JSON export/import.
⚠️ Limitations
No Cloud Synchronization
Data cannot be accessed across multiple devices.
No Authentication System
Lacks user accounts and personalized profiles.
LocalStorage Constraints
Data may be lost if browser storage is cleared.
Limited Analytics
Does not include advanced visualizations or trends.
Single-User Design
Not scalable for multi-user environments.
🛠️ Technology Stack
Layer	Technology
Structure	HTML5
Styling	CSS3 (Custom Properties, Animations, Responsive Design)
Logic	JavaScript (ES6 Modules, DOM Manipulation)
Storage	Browser LocalStorage API
🧠 System Architecture

The application follows a modular and structured approach:

State Management
Centralized state object for entries, habits, and filters
Modules
utils → Helper & utility functions
storage → LocalStorage handling & data persistence
ui → Rendering and DOM updates
theme → Theme management
app → Core application logic
Data Handling
Version-controlled storage format
JSON-based import/export system
📁 Project Structure
mindful-moments/
│
├── index.html        # Application layout
├── style.css         # Styling, themes, animations
├── script.js         # Core logic and functionality
└── README.md         # Documentation
⚙️ Installation & Usage
Clone the repository:
git clone https://github.com/your-username/mindful-moments.git
Navigate to the project directory:
cd mindful-moments
Run the application:
Open index.html in any modern browser

No installation, build tools, or dependencies required.

🔒 Privacy & Security
Fully client-side application
No external APIs or data transmission
No tracking or data collection
User data remains entirely private
📈 Future Enhancements
Cloud synchronization (Firebase / Backend integration)
User authentication system
Advanced analytics & charts
Reminder notifications
Progressive Web App (PWA) support
Mobile application version
🤝 Contribution

Contributions are welcome.

Fork the repository
Create a new branch
Commit your changes
Submit a Pull Request
📄 License

This project is licensed under the MIT License.

👨‍💻 Author

Kartikey
