# **App Name**: HackSync Reg

## Core Features:

- Participant Registration Form: A comprehensive multi-step form to collect all personal, academic, team information, and optional links, with client-side validation as per the specified Firestore schema.
- User Authentication: Secure sign-up and login functionality for participants to access and manage their registration. (e.g., Email/Password authentication)
- Razorpay Payment Integration: Seamless integration with Razorpay to handle registration fee payments. Only upon successful payment will participant data be stored.
- Real-time Participant Dashboard: An administrative interface displaying all registered participants with their complete details and payment statuses, updating in real-time as new registrations or payments occur.
- Firestore Data Persistence: Robust data storage and retrieval using Firebase Firestore, structured precisely according to the provided 'participants' collection schema.
- Payment Status Auto-Update: Automated system to update a participant's 'paymentStatus' field in Firestore to 'completed' immediately following a successful Razorpay transaction.
- Team Name Idea Generator Tool: An AI-powered tool integrated into the registration flow that suggests creative team names based on user input or hackathon theme to assist participants.

## Style Guidelines:

- Primary color: Modern Indigo (#5E26D9). A deep and energetic purple to represent innovation and tech focus.
- Background color: Dark Slate Blue (#221E2B). A very dark, slightly desaturated indigo providing a sophisticated and tech-centric backdrop.
- Accent color: Electric Blue (#7AC5FF). A vibrant and contrasting blue, used for interactive elements, highlights, and calls to action, drawing attention and suggesting efficiency.
- Body and headline font: 'Inter' (sans-serif). A modern, objective, and highly legible sans-serif chosen for its versatility and clean aesthetic across forms and data display, ensuring excellent readability for all participant information.
- Utilize clean, geometric, and functional icons. Icons should be easily understandable and contribute to intuitive navigation within forms and dashboards.
- The layout emphasizes clarity and data organization. Registration forms will be logically segmented. The real-time dashboard will feature a clear table or card-based structure for participant display, ensuring responsiveness across devices.
- Subtle, fluid animations will provide feedback for user interactions such as form submissions, successful payments, and transitions between registration steps or dashboard views, enhancing the user experience without distraction.