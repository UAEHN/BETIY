# Product Requirements Document (PRD) for "Beity"

### **Project Idea**
"Beity" is a web application designed to streamline household shopping management and communication within a single platform. It addresses two primary challenges:
1. **Shopping Organization:** It eliminates the issues of lost paper lists or difficult sharing by providing dynamic digital shopping lists. When a user types the desired products into an input field and submits them, the items are automatically categorized (e.g., "tomatoes" → "vegetables") based on keywords or a simple algorithm, then displayed to the shopper in a neat, visually appealing, and organized format to simplify the shopping process.
2. **Direct Communication:** It offers an integrated chat feature within the app for discussing needs or planning, with the ability to add individuals for group communication. Through the chat, users can directly send shopping lists or individual products to each other for seamless coordination.

The application is transformed into a **Progressive Web App (PWA)** to allow installation on mobile devices, supporting offline functionality with local storage and subsequent synchronization. It leverages **Supabase** for data storage and real-time updates, ensuring a synchronized experience across users in real time. The goal is to deliver a practical, simple, and flexible tool that can evolve with future smart features.

### **Objectives**
- Simplify household shopping list management with automatic categorization and organized display.
- Enhance internal communication among family members with the ability to add individuals and send lists or products via chat.
- Provide easy access through a PWA with offline support.

---

## **Functional Requirements**
### **Core Features**
1. **Shopping Lists**
   - Create shopping lists with manual item addition.
   - Automatically categorize products upon submission (e.g., "tomatoes" → "vegetables").
   - Display the list in a neat, visually appealing format for the shopper, with the ability to mark items as completed.
2. **Internal Chat**
   - Send real-time messages with timestamps within the app.
   - Send shopping lists or individual products directly through the chat to other users.
   - Add individuals for group communication.
3. **Push Notifications**
   - Send notifications when a new item or message is added.
4. **PWA Support**
   - Enable app installation on the home screen.
   - Support offline functionality with subsequent synchronization.

### **Future Enhancements**
1. **Phase 1:**
   - Smart reminders based on consumption patterns.
   - Budget management (cost tracking).
2. **Phase 2:**
   - Voice recognition for adding items.
   - Integration with delivery services via API.
   - Smart suggestions based on habits.
3. **Phase 3:**
   - Arrange lists based on store layout.
   - Calendar integration.
   - Recipe assistant.

---

## **Technical Requirements**
### **Programming Languages**
- **TypeScript:** 
  - Used for writing interactive front-end code.
  - Manages state and data fetching from Supabase.
  - Defines data types (e.g., `ShoppingItem`, `Message`) for code safety.
- **HTML:** 
  - Builds the structure of pages and components.
  - Creates UI elements like input fields and lists.
- **CSS:** 
  - Styles the interface using Tailwind CSS.
  - Ensures responsive design across devices.

### **Tools and Libraries**
- **Front-End:**
  - React.js  
  - Tailwind CSS  
  - Shadcn UI  
- **Data Management:**
  - Supabase (Database + Realtime)  
- **PWA:**
  - Workbox  

### **Folder Structure**
```
beity/
├── components/
│   ├── shopping-list/index.tsx
│   └── chat/index.tsx
├── lib/
│   ├── supabase.ts
│   └── utils.ts
├── public/
│   ├── manifest.json
│   ├── sw.ts
│   └── icon-*.png
└── styles/
```

### **Database Schema (Supabase)**
- **`shopping_list`:**
  - `id` (int, PK)
  - `item` (string)
  - `category` (string)
  - `completed` (boolean)
- **`messages`:**
  - `id` (int, PK)
  - `user_id` (string)
  - `message` (string)
  - `timestamp` (datetime)
- **`users`:**
  - `id` (string, PK)
  - `name` (string)