# VoiceAgent Platform - User Guide

## Getting Started

### 1. Access the Application
- The application starts at the **Landing Page** (`/auth/landing`)
- This page introduces the VoiceAgent platform with key features and benefits

### 2. Sign Up
1. Click **"Get Started"** button on the landing page
2. You'll be directed to `/auth/register`
3. Fill in the registration form:
   - **Full Name**: Your name
   - **Email**: Your email address
   - **Password**: At least 8 characters
   - **Confirm Password**: Must match password
4. Check the Terms checkbox
5. Click **"Create Account"**

### 3. Sign In
1. If you already have an account, click **"Sign In"** on landing page
2. Go to `/auth/login`
3. Enter your email and password
4. Optionally check **"Remember me"**
5. Click **"Sign In"**

## Theme Switching

### Light Mode
1. Locate the **Sun icon** in the top navigation bar (if in dark mode)
2. Click to switch to light theme
3. Your preference is automatically saved

### Dark Mode
1. Locate the **Moon icon** in the top navigation bar (if in light mode)
2. Click to switch to dark theme
3. Your preference is automatically saved

**Note**: The theme preference persists across sessions

## Password Fields

### Viewing Your Password
1. In any password field, look for the **Eye icon** on the right
2. **Eye icon**: Shows your password as you type
3. **EyeOff icon**: Hides your password (default)
4. Click the icon to toggle visibility

**Available in**:
- Login page (password field)
- Register page (password and confirm password fields)

## Dashboard Navigation

After logging in, use the **Sidebar** on the left to navigate:

### Dashboard (`/`)
- Overview of your AI voice agents
- Statistics: Agents, Calls, Minutes, Numbers
- Quick actions: Create Agent, Buy Number
- Recent calls table

### Agents (`/agents`)
- View all your AI voice agents
- Create new agents
- Edit agent configuration
- Manage agent settings
- View agent statistics

### Phone Numbers (`/numbers`)
- Manage your phone numbers
- Assign numbers to agents
- Buy new numbers
- Track phone number status and costs

### Call Logs (`/logs`)
- View all call history
- Filter calls by various criteria
- See call details and transcripts
- Download or review recordings
- Check call metadata

### Test Agent (`/test-agent`)
- Test your agents in real-time
- Select an agent from dropdown
- Click microphone to start a test call
- View live transcript
- See agent responses

### Settings (`/settings`)
- Manage API keys
- Configure LLM providers:
  - OpenAI API key
  - Groq API key
  - Gemini API key
- Configure TTS providers:
  - ElevenLabs key
- Configure telephony:
  - Plivo credentials

## Features in Detail

### Creating an Agent
1. Navigate to **Agents** page
2. Click **"Create New Agent"** button
3. Fill in the agent configuration:
   - **Agent Name**: Unique name for your agent
   - **System Prompt**: Instructions for the agent
   - **First Message**: Initial greeting
   - **Voice Provider**: Select ElevenLabs, Google, or OpenAI
   - **Voice**: Choose specific voice
   - **LLM Provider**: Select GPT-4, Groq, or Gemini
   - **Temperature**: Adjust response creativity
   - **Max Duration**: Set call time limits
   - **Webhook URL**: For event notifications
4. Click **"Save Agent"**

### Buying a Phone Number
1. Navigate to **Phone Numbers** page
2. Click **"Buy Number"** button
3. Select country (India, USA, etc.)
4. Choose number type (Local, Toll-free)
5. Select from available numbers list
6. Assign to an agent
7. Complete purchase

### Reviewing Call Logs
1. Navigate to **Call Logs** page
2. Use filters to find specific calls:
   - Date range
   - Agent name
   - Status (completed, failed, ongoing)
3. Click a call to see details
4. View full transcript in side panel
5. Play recording if available

### Testing an Agent
1. Navigate to **Test Agent** page
2. Select an agent from dropdown
3. Click the **Microphone button** to start test
4. Speak your message
5. Agent responds in real-time
6. View transcript of conversation
7. Check connection status at bottom

## Responsive Design

The application works perfectly on:
- **Desktop**: Full sidebar, complete navigation
- **Tablet**: Sidebar can be toggled
- **Mobile**: Hamburger menu for sidebar access

On mobile devices:
- Click the **Menu icon** (top-left) to open sidebar
- Click **X icon** to close sidebar
- All features accessible from mobile menu

## Keyboard Shortcuts

- **ESC**: Close modals and drawers
- **TAB**: Navigate through form fields
- **ENTER**: Submit forms

## Tips & Tricks

1. **Dark Mode for Late Night**: Switch to dark mode for reduced eye strain
2. **Remember Login**: Check "Remember me" to stay logged in longer
3. **Strong Passwords**: Use passwords with mix of letters, numbers, special chars
4. **Agent Testing**: Always test agents before deploying to production
5. **Monitor Costs**: Check phone number costs regularly in Phone Numbers page

## Troubleshooting

### Can't Log In
- Verify email and password are correct
- Check that account was created successfully
- Try clearing browser cookies and cache

### Theme Not Changing
- Click the theme toggle again
- Hard refresh browser (Ctrl+Shift+R)
- Check browser localStorage isn't full

### Password Not Toggling
- Click the eye icon clearly
- Try tab key to focus on password field
- Refresh page if stuck

### Pages Not Loading
- Check internet connection
- Clear browser cache
- Hard refresh the page (Ctrl+Shift+R)

## Account Management

### Update Profile
- Navigate to **Settings** page
- Click your avatar in sidebar
- Update your information

### Reset Password
- On login page, click **"Forgot password?"**
- Follow email instructions

### Logout
- Click user avatar (top-right)
- Select **"Logout"** from menu

---

**Need Help?** Check the inline help tips or contact support.

For more information, see FEATURES.md
