# Screen Reader Testing Guide

## Overview
This guide provides instructions for testing the Web Radio Player with screen reader software to ensure full accessibility compliance.

## Recommended Screen Readers for Testing

### Windows
- **NVDA (Free)**: Download from https://www.nvaccess.org/
- **JAWS**: Commercial screen reader (30-day trial available)
- **Narrator**: Built into Windows 10/11

### macOS
- **VoiceOver**: Built into macOS (enable with Cmd+F5)

### Linux
- **Orca**: Built into most Linux distributions

## Basic Screen Reader Commands

### NVDA (Windows)
- **Start/Stop**: Ctrl + Alt + N
- **Say All**: Ctrl + A
- **Next Heading**: H
- **Previous Heading**: Shift + H
- **Next Link**: K
- **Next Button**: B
- **Next Form Field**: F
- **Navigate by Element**: Arrow keys
- **Stop Speech**: Ctrl

### VoiceOver (macOS)
- **Start/Stop**: Cmd + F5
- **Navigate**: Ctrl + Option + Arrow keys
- **Rotor**: Ctrl + Option + U
- **Next Heading**: Ctrl + Option + Cmd + H
- **Stop Speech**: Ctrl

## Testing Checklist

### 1. Page Structure Navigation
- [ ] **Skip Links**: Verify skip navigation links work (Tab to access, Enter to activate)
- [ ] **Headings**: Navigate by headings (H1: "Hi-Fi Radio", H2: sections, H3: subsections)
- [ ] **Landmarks**: Test navigation by landmarks (main, complementary, banner)
- [ ] **Reading Order**: Ensure content reads in logical order

### 2. Station List Navigation
- [ ] **List Recognition**: Screen reader identifies station list as a list
- [ ] **Station Information**: Each station announces name, genre, and favorite status
- [ ] **Arrow Key Navigation**: Up/down arrows work to navigate stations
- [ ] **Search Function**: Search field is properly labeled and functional

### 3. Playback Controls
- [ ] **Audio Player**: HTML5 controls are accessible and properly labeled
- [ ] **Play Station**: Stations can be activated with Enter/Space keys
- [ ] **Status Updates**: Loading states and now playing information announced
- [ ] **Error Messages**: Error messages are announced immediately

### 4. Interactive Elements
- [ ] **Buttons**: All buttons have descriptive labels
- [ ] **Form Controls**: All form elements have proper labels
- [ ] **Focus Management**: Focus moves logically through interface
- [ ] **Visual Focus**: Keyboard focus is visible (may need to disable screen reader temporarily)

### 5. Dynamic Content
- [ ] **Live Regions**: Status updates announced automatically
- [ ] **Loading States**: Loading and buffering states communicated
- [ ] **Content Changes**: Visualization changes announced
- [ ] **Error Handling**: Errors announced with appropriate urgency

### 6. Keyboard Shortcuts
- [ ] **Arrow Navigation**: Up/down arrows navigate stations
- [ ] **Enter/Space**: Activate focused station
- [ ] **F Key**: Toggle favorite for focused station
- [ ] **Home/End**: Navigate to first/last station
- [ ] **Escape**: Return focus to search
- [ ] **? Key**: Display help information

## Test Scenarios

### Scenario 1: First-time User
1. Navigate to the page
2. Use skip links to reach main content
3. Explore the interface structure using headings
4. Find and focus on the search field
5. Search for a station type (e.g., "rock")
6. Navigate search results
7. Select and play a station

### Scenario 2: Experienced User
1. Use keyboard shortcuts to quickly navigate stations
2. Toggle favorite status for stations
3. Change visualization type
4. Switch between light and dark themes
5. Use audio controls to adjust volume

### Scenario 3: Error Handling
1. Test with network disconnected (if possible)
2. Try to play a non-functional stream
3. Verify error messages are announced
4. Test recovery when network returns

## Common Issues to Check For

### Content Issues
- [ ] Missing or poor labels on form controls
- [ ] Images without appropriate alt text
- [ ] Poor heading structure
- [ ] Missing skip navigation
- [ ] Content not in reading order

### Interaction Issues
- [ ] Elements not keyboard accessible
- [ ] Focus not visible
- [ ] Focus traps or jumps unexpectedly
- [ ] Custom controls don't work with screen readers

### Dynamic Content Issues
- [ ] Status changes not announced
- [ ] Loading states not communicated
- [ ] Error messages not urgent enough
- [ ] Content changes cause confusion

## Testing Tips

1. **Test with Eyes Closed**: Try using the interface with your monitor turned off
2. **Test Different Browsers**: Screen readers may behave differently in different browsers
3. **Test at Different Speeds**: Screen readers can read at various speeds
4. **Test Real Usage**: Actually listen to music and navigate as a real user would
5. **Document Issues**: Keep notes on any confusing or broken interactions

## Expected Behavior

### When Working Correctly
- Screen reader announces all content in logical order
- All interactive elements are accessible via keyboard
- Status changes are communicated immediately
- User can complete all tasks without visual input
- Navigation is efficient and predictable

### Screen Reader Announcements
- "Hi-Fi Radio, main, web radio player application"
- "Available radio stations, list with X items"
- "Station name - genre - button - currently playing" (for active station)
- "Loading stream" / "Now playing: station name"
- "Error: [error description]" (for errors)

## Resources

- [WebAIM Screen Reader Testing](https://webaim.org/articles/screenreader_testing/)
- [NVDA User Guide](https://www.nvaccess.org/files/nvda/documentation/userGuide.html)
- [VoiceOver User Guide](https://support.apple.com/guide/voiceover-guide/welcome/web)
- [W3C ARIA Practices](https://www.w3.org/WAI/ARIA/apg/)

## Report Issues

When reporting accessibility issues, include:
- Screen reader and version used
- Browser and version
- Operating system
- Specific steps to reproduce
- Expected vs actual behavior
- Impact on user experience
