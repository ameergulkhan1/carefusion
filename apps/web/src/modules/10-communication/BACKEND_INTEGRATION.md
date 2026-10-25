# Module 10: Inter-Provider Communication - Backend Integration Guide

## Overview
Module 10 provides secure peer-to-peer communication between healthcare providers with encrypted messaging, patient record sharing, treatment plan collaboration, and group discussions.

## API Base URL
```
Base: /api/communication
Version: v1
Authentication: Required (JWT Bearer Token)
```

## Endpoints

### 1. MESSAGING - Secure Doctor-to-Doctor Communication

#### Send Message
```http
POST /communication/messages
Content-Type: application/json
Authorization: Bearer {token}

Request Body:
{
  "recipientId": "doctor_uuid",
  "conversationId": "conversation_uuid",
  "content": "Message content",
  "attachments": [
    {
      "fileId": "file_uuid",
      "fileName": "document.pdf",
      "fileType": "application/pdf",
      "fileSize": 2048
    }
  ],
  "encrypted": true
}

Response (200):
{
  "messageId": "msg_uuid",
  "conversationId": "conversation_uuid",
  "senderId": "sender_uuid",
  "recipientId": "recipient_uuid",
  "content": "Message content",
  "timestamp": "2026-04-02T10:30:00Z",
  "read": false,
  "encrypted": true
}

Error Codes:
- 400: Invalid message data
- 401: Unauthorized
- 403: Forbidden - sender or recipient not found
- 500: Server error
```

#### Get Conversation
```http
GET /communication/conversations/{conversationId}?limit=50&offset=0
Authorization: Bearer {token}

Query Parameters:
- limit: Number of messages to fetch (default: 50, max: 100)
- offset: Pagination offset (default: 0)
- includeRead: Include read receipts (default: false)

Response (200):
{
  "conversationId": "conversation_uuid",
  "participantIds": ["doctor1_uuid", "doctor2_uuid"],
  "title": "Patient Case Discussion",
  "createdAt": "2026-03-15T08:00:00Z",
  "lastMessageAt": "2026-04-02T10:30:00Z",
  "messages": [
    {
      "messageId": "msg_uuid",
      "senderId": "sender_uuid",
      "content": "Encrypted message...",
      "timestamp": "2026-04-02T10:25:00Z",
      "read": true,
      "readAt": "2026-04-02T10:27:00Z"
    }
  ],
  "totalMessages": 145,
  "unreadCount": 0
}
```

#### Get All Conversations
```http
GET /communication/conversations
Authorization: Bearer {token}

Query Parameters:
- page: Page number (default: 1)
- limit: Items per page (default: 20)
- sort: Sort by (createdAt, lastMessageAt, title)

Response (200):
{
  "conversations": [
    {
      "conversationId": "conv_uuid",
      "participantIds": ["doctor1_uuid", "doctor2_uuid"],
      "title": "Case Discussion",
      "lastMessageAt": "2026-04-02T10:30:00Z",
      "lastMessage": "Quick text preview...",
      "unreadCount": 0
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 5,
    "totalItems": 87,
    "itemsPerPage": 20
  }
}
```

#### Create Conversation
```http
POST /communication/conversations
Content-Type: application/json
Authorization: Bearer {token}

Request Body:
{
  "participantIds": ["doctor_uuid1", "doctor_uuid2"],
  "title": "Patient Case Discussion",
  "isEncrypted": true,
  "speciality": "Cardiology"
}

Response (201):
{
  "conversationId": "new_conv_uuid",
  "participantIds": ["doctor1_uuid", "doctor2_uuid"],
  "title": "Patient Case Discussion",
  "createdAt": "2026-04-02T10:30:00Z",
  "createdBy": "current_user_uuid",
  "isEncrypted": true
}
```

#### Search Messages
```http
GET /communication/messages/search?query={query}&conversationId={conversationId}
Authorization: Bearer {token}

Query Parameters:
- query: Search term (required)
- conversationId: Limit search to conversation (optional)
- startDate: Search from date (optional, ISO format)
- endDate: Search to date (optional, ISO format)
- limit: Max results (default: 50)

Response (200):
{
  "results": [
    {
      "messageId": "msg_uuid",
      "conversationId": "conv_uuid",
      "senderId": "sender_uuid",
      "snippet": "...search term highlighted...",
      "timestamp": "2026-04-02T10:25:00Z"
    }
  ],
  "totalResults": 12
}
```

### 2. PATIENT RECORD SHARING

#### Share Patient Records
```http
POST /communication/share-records
Content-Type: application/json
Authorization: Bearer {token}

Request Body:
{
  "patientId": "patient_uuid",
  "recipientDoctorId": "doctor_uuid",
  "recordTypes": ["clinical_notes", "lab_results", "prescriptions"],
  "expiresAt": "2026-05-02T10:30:00Z",
  "accessLevel": "read-only",
  "reason": "Second opinion consultation"
}

Response (201):
{
  "shareId": "share_uuid",
  "patientId": "patient_uuid",
  "sharedBy": "current_doctor_uuid",
  "sharedWith": "recipient_doctor_uuid",
  "recordTypes": ["clinical_notes", "lab_results", "prescriptions"],
  "createdAt": "2026-04-02T10:30:00Z",
  "expiresAt": "2026-05-02T10:30:00Z",
  "accessLevel": "read-only",
  "status": "active"
}

Error Codes:
- 400: Invalid patient or recipient
- 403: No permission to share records
- 409: Records already shared with this doctor
```

#### Get Shared Records
```http
GET /communication/shared-records
Authorization: Bearer {token}

Query Parameters:
- type: Filter by share type (sent, received, both) - default: both
- status: active, expired, revoked
- page: Page number (default: 1)
- limit: Items per page (default: 20)

Response (200):
{
  "sharedRecords": [
    {
      "shareId": "share_uuid",
      "patientId": "patient_uuid",
      "patientName": "John Doe",
      "sharedBy": "Doctor Name",
      "sharedWith": "Recipient Doctor",
      "recordTypes": ["clinical_notes", "lab_results"],
      "createdAt": "2026-04-02T10:30:00Z",
      "expiresAt": "2026-05-02T10:30:00Z",
      "accessLevel": "read-only",
      "status": "active"
    }
  ],
  "total": 45
}
```

#### Get Doctors Shared with Specific Patient
```http
GET /communication/shared-doctors/{patientId}
Authorization: Bearer {token}

Response (200):
{
  "doctors": [
    {
      "doctorId": "doctor_uuid",
      "name": "Dr. Smith",
      "speciality": "Cardiology",
      "hospital": "City Hospital",
      "recordTypes": ["clinical_notes", "lab_results"],
      "sharedAt": "2026-04-02T10:30:00Z",
      "expiresAt": "2026-05-02T10:30:00Z",
      "accessLevel": "read-only"
    }
  ]
}
```

#### Revoke Record Share
```http
DELETE /communication/shared-records/{shareId}
Authorization: Bearer {token}

Response (200):
{
  "message": "Record sharing revoked successfully",
  "shareId": "share_uuid",
  "revokedAt": "2026-04-02T10:35:00Z"
}
```

### 3. COLLABORATION & TREATMENT PLANS

#### Create Collaboration
```http
POST /communication/collaborations
Content-Type: application/json
Authorization: Bearer {token}

Request Body:
{
  "patientId": "patient_uuid",
  "collaboratorIds": ["doctor_uuid1", "doctor_uuid2"],
  "title": "Cardiac Treatment Plan",
  "description": "Multi-specialist treatment coordination",
  "treatmentPlan": {
    "goals": ["Improve cardiac function", "Reduce medication dependency"],
    "timeline": "3 months",
    "initialPlan": "Initial treatment outline..."
  },
  "visibility": "collaborators-only"
}

Response (201):
{
  "collaborationId": "collab_uuid",
  "patientId": "patient_uuid",
  "initiatedBy": "current_doctor_uuid",
  "collaboratorIds": ["doctor_uuid1", "doctor_uuid2"],
  "title": "Cardiac Treatment Plan",
  "createdAt": "2026-04-02T10:30:00Z",
  "status": "active",
  "treatmentPlan": {
    "planId": "plan_uuid",
    "goals": [...],
    "timeline": "3 months",
    "createdAt": "2026-04-02T10:30:00Z",
    "lastUpdatedAt": "2026-04-02T10:30:00Z"
  }
}
```

#### Get Collaborations for Patient
```http
GET /communication/collaborations?patientId={patientId}
Authorization: Bearer {token}

Response (200):
{
  "collaborations": [
    {
      "collaborationId": "collab_uuid",
      "patientId": "patient_uuid",
      "title": "Cardiac Treatment Plan",
      "initiatedBy": "Dr. Smith",
      "collaboratorCount": 3,
      "status": "active",
      "createdAt": "2026-04-02T10:30:00Z"
    }
  ]
}
```

#### Update Treatment Plan
```http
PUT /communication/collaborations/{collaborationId}/plan
Content-Type: application/json
Authorization: Bearer {token}

Request Body:
{
  "goals": ["Updated goal 1", "Updated goal 2"],
  "timeline": "4 months",
  "currentStatus": "Proceeding as planned",
  "nextSteps": "Schedule follow-up tests"
}

Response (200):
{
  "planId": "plan_uuid",
  "collaborationId": "collab_uuid",
  "updatedBy": "current_doctor_uuid",
  "goals": [...],
  "timeline": "4 months",
  "currentStatus": "Proceeding as planned",
  "nextSteps": "Schedule follow-up tests",
  "lastUpdatedAt": "2026-04-02T10:35:00Z"
}
```

#### Add Comment to Treatment Plan
```http
POST /communication/collaborations/{collaborationId}/comments
Content-Type: application/json
Authorization: Bearer {token}

Request Body:
{
  "comment": "Patient responding well to initial treatment",
  "commentType": "clinical_note",
  "attachments": ["file_uuid1", "file_uuid2"]
}

Response (201):
{
  "commentId": "comment_uuid",
  "collaborationId": "collab_uuid",
  "author": {
    "doctorId": "doctor_uuid",
    "name": "Dr. Smith",
    "speciality": "Cardiology"
  },
  "comment": "Patient responding well to initial treatment",
  "commentType": "clinical_note",
  "createdAt": "2026-04-02T10:40:00Z",
  "updatedAt": "2026-04-02T10:40:00Z"
}
```

#### Get Comments on Treatment Plan
```http
GET /communication/collaborations/{collaborationId}/comments?page=1&limit=50
Authorization: Bearer {token}

Response (200):
{
  "comments": [
    {
      "commentId": "comment_uuid",
      "author": {
        "doctorId": "doctor_uuid",
        "name": "Dr. Smith",
        "speciality": "Cardiology"
      },
      "comment": "Clinical note content",
      "commentType": "clinical_note",
      "createdAt": "2026-04-02T10:40:00Z",
      "isEdited": false,
      "likes": 2
    }
  ],
  "totalComments": 145,
  "pagination": {
    "currentPage": 1,
    "totalPages": 3
  }
}
```

### 4. COMMUNICATION HISTORY & AUDIT TRAIL

#### Get Communication History
```http
GET /communication/history?startDate={date}&endDate={date}
Authorization: Bearer {token}

Query Parameters:
- startDate: ISO date string
- endDate: ISO date string
- userId: Filter by user (optional)
- patientId: Filter by patient (optional)
- type: message, share, collaboration, comment
- limit: Default 100, max 500
- offset: Pagination offset

Response (200):
{
  "history": [
    {
      "eventId": "event_uuid",
      "timestamp": "2026-04-02T10:30:00Z",
      "actionType": "message_sent",
      "actor": "doctor_uuid",
      "recipient": "doctor_uuid2",
      "relatedPatients": ["patient_uuid"],
      "details": "Message sent via secure channel"
    }
  ],
  "totalEvents": 1245
}
```

#### Export Communication History
```http
GET /communication/history/export?format=pdf&startDate={date}&endDate={date}
Authorization: Bearer {token}
Accept: application/pdf

Query Parameters:
- format: pdf, csv, json
- startDate: ISO date string
- endDate: ISO date string
- includeDetails: true/false

Response (200): Binary file download
Content-Type: application/pdf
Content-Disposition: attachment; filename="communication_history.pdf"
```

### 5. GROUP DISCUSSIONS & FORUMS

#### Create Group Discussion
```http
POST /communication/group-discussions
Content-Type: application/json
Authorization: Bearer {token}

Request Body:
{
  "title": "Hypertension Management Best Practices",
  "description": "Discuss latest hypertension treatment guidelines",
  "specialty": "Cardiology",
  "department": "Internal Medicine",
  "isModerated": true,
  "tags": ["hypertension", "guidelines", "treatment"]
}

Response (201):
{
  "discussionId": "disc_uuid",
  "title": "Hypertension Management Best Practices",
  "createdBy": "doctor_uuid",
  "specialty": "Cardiology",
  "createdAt": "2026-04-02T10:30:00Z",
  "memberCount": 1,
  "postCount": 0
}
```

#### Get Group Discussions
```http
GET /communication/group-discussions?specialty=Cardiology&page=1
Authorization: Bearer {token}

Query Parameters:
- specialty: Filter by specialty (required or departmental)
- department: Filter by department
- search: Search in titles
- page: Page number (default: 1)
- limit: Items per page (default: 20)
- sort: newest, mostActive, mostMembers

Response (200):
{
  "discussions": [
    {
      "discussionId": "disc_uuid",
      "title": "Hypertension Management",
      "description": "...",
      "createdBy": "Dr. Smith",
      "specialty": "Cardiology",
      "memberCount": 45,
      "postCount": 234,
      "lastActivityAt": "2026-04-02T10:30:00Z",
      "tags": ["hypertension", "guidelines"]
    }
  ],
  "pagination": {
    "page": 1,
    "totalPages": 12,
    "totalItems": 234
  }
}
```

#### Post to Group Discussion
```http
POST /communication/group-discussions/{discussionId}/posts
Content-Type: application/json
Authorization: Bearer {token}

Request Body:
{
  "content": "Post content with clinical insights",
  "references": {
    "studyIds": ["study_uuid1"],
    "caseIds": ["case_uuid1"]
  },
  "attachments": ["file_uuid1"]
}

Response (201):
{
  "postId": "post_uuid",
  "discussionId": "disc_uuid",
  "author": {
    "doctorId": "doctor_uuid",
    "name": "Dr. Smith",
    "speciality": "Cardiology"
  },
  "content": "Post content",
  "createdAt": "2026-04-02T10:40:00Z",
  "likes": 0,
  "replies": 0
}
```

#### Get Discussion Posts
```http
GET /communication/group-discussions/{discussionId}/posts?page=1&sort=newest
Authorization: Bearer {token}

Query Parameters:
- page: Page number
- limit: Items per page (default: 20)
- sort: newest, oldest, mostLiked

Response (200):
{
  "posts": [
    {
      "postId": "post_uuid",
      "author": {
        "doctorId": "doctor_uuid",
        "name": "Dr. Smith",
        "speciality": "Cardiology"
      },
      "content": "Post content",
      "createdAt": "2026-04-02T10:40:00Z",
      "likes": 5,
      "replies": 2,
      "liked": false
    }
  ],
  "pagination": {
    "page": 1,
    "totalPages": 8,
    "totalPosts": 145
  }
}
```

#### React to Post
```http
POST /communication/posts/{postId}/react
Content-Type: application/json
Authorization: Bearer {token}

Request Body:
{
  "reaction": "like"  // like, helpful, insightful, agree, disagree
}

Response (200):
{
  "postId": "post_uuid",
  "reaction": "like",
  "totalLikes": 6,
  "userReacted": true
}
```

## Service Integration Examples

### In React Component (Module 10 - Messaging Example)
```javascript
import { communicationService } from '../modules/10-communication/services/communicationService';

const Messaging = () => {
  const [messages, setMessages] = useState([]);
  const [conversations, setConversations] = useState([]);

  useEffect(() => {
    // Fetch all conversations
    communicationService.getConversations()
      .then(data => setConversations(data.conversations))
      .catch(err => console.error('Error:', err));
  }, []);

  const handleSendMessage = async (conversationId, content) => {
    try {
      const response = await communicationService.sendMessage({
        conversationId,
        content,
        encrypted: true
      });
      // Update UI with new message
      setMessages([...messages, response]);
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  const handleShareRecords = async (patientId, recipientDoctorId) => {
    try {
      const response = await communicationService.sharePatientRecords({
        patientId,
        recipientDoctorId,
        recordTypes: ['clinical_notes', 'lab_results'],
        accessLevel: 'read-only',
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      });
      console.log('Records shared successfully:', response);
    } catch (error) {
      console.error('Failed to share records:', error);
    }
  };

  return (
    // Component JSX
  );
};
```

## Authentication & Authorization

### Required Headers
```http
Authorization: Bearer {jwt_token}
Content-Type: application/json
X-Request-ID: {uuid}  [optional for tracing]
```

### Permission Requirements
- **Messaging**: User must be registered healthcare provider
- **Record Sharing**: Patient must
 authorize; doctor must have patient relationship
- **Collaboration**: All collaborators must accept invitation
- **Group Discussions**: Registered doctors in matching specialty
- **Export**: User must have compliance/audit roles

## Error Handling

### Standard Error Response Format
```json
{
  "error": {
    "code": "INVALID_REQUEST",
    "message": "Description of the error",
    "details": {
      "field": "conversationId",
      "issue": "Not found"
    },
    "timestamp": "2026-04-02T10:45:00Z"
  }
}
```

### Common Error Codes
- `INVALID_REQUEST` (400): Bad request data
- `UNAUTHORIZED` (401): Missing/invalid token
- `FORBIDDEN` (403): Insufficient permissions
- `NOT_FOUND` (404): Resource not found
- `CONFLICT` (409): Duplicate or state conflict
- `RATE_LIMITED` (429): Too many requests
- `SERVER_ERROR` (500): Internal server error

## Rate Limiting
```
Messages: 100/minute
Records Sharing: 50/hour
Group Posts: 30/minute
Search: 60/minute
```

## Webhook Events
All communication activities can trigger webhooks:
```
- communication.message.sent
- communication.message.read
- communication.records.shared
- communication.records.revoked
- communication.collaboration.created
- communication.collaboration.updated
- communication.discussion.post.created
```

## Best Practices

1. **Encryption**: Always encrypt sensitive data before sending
2. **Audit Trail**: Communication is fully audited by default
3. **Consent**: Ensure patient consent before sharing records
4. **Expiration**: Set expiration dates on record shares
5. **Compliance**: Track all HIPAA-related communications
6. **Error Handling**: Implement proper error handling and user feedback
7. **Pagination**: Use pagination for large result sets
8. **Caching**: Implement client-side caching for conversations

## Testing Endpoints

You can test these endpoints using curl, Postman, or the provided testing scripts:

```bash
# Example: Send a message
curl -X POST http://localhost:3001/api/communication/messages \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "recipientId": "doctor_uuid",
    "conversationId": "conv_uuid",
    "content": "Test message"
  }'
```
