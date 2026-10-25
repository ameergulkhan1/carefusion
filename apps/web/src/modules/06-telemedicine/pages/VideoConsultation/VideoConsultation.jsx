import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { JitsiMeeting } from '@jitsi/react-sdk';
import { useAuth } from '../../../../context/AuthContext';
import telemedicineService from '../../services/telemedicineService';
import Button from '../../../../components/common/Button/Button';
import './VideoConsultation.css';

const VideoConsultation = () => {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [roomName, setRoomName] = useState('');
  const [sessionId, setSessionId] = useState('');
  const [consultationMeta, setConsultationMeta] = useState(null);
  const [loadingSession, setLoadingSession] = useState(true);
  const [sessionError, setSessionError] = useState('');
  const [isCallActive, setIsCallActive] = useState(false);

  const queryParams = new URLSearchParams(location.search);
  const appointmentId = id || queryParams.get('appointmentId') || queryParams.get('id') || '';
  const role = user?.role || 'patient';

  const displayName = useMemo(() => {
    return user?.fullName || user?.name || user?.email || 'CareFusion User';
  }, [user]);

  const fallbackRoomName = useMemo(() => {
    if (appointmentId) {
      return `carefusion-consultation-${String(appointmentId).toLowerCase()}`;
    }
    return `carefusion-${role}-lobby`;
  }, [appointmentId, role]);

  const normalizeSessionPayload = (payload = {}) => {
    const data = payload?.data || payload || {};
    const room = data.roomName || data.room || data.meetingRoom || data.sessionRoom || '';
    const normalizedSessionId = data.sessionId || data.consultationId || data.id || '';

    return {
      roomName: room,
      sessionId: normalizedSessionId,
      meta: data
    };
  };

  useEffect(() => {
    let isMounted = true;

    const initializeConsultation = async () => {
      try {
        setLoadingSession(true);
        setSessionError('');

        if (appointmentId) {
          try {
            const response = await telemedicineService.startConsultation(appointmentId);
            const normalized = normalizeSessionPayload(response);

            if (!isMounted) return;

            setConsultationMeta(normalized.meta || null);
            setSessionId(normalized.sessionId || '');
            setRoomName(normalized.roomName || fallbackRoomName);
            return;
          } catch (error) {
            if (!isMounted) return;
            console.warn('Consultation start API unavailable, using fallback room:', error);
            setSessionError('Live session metadata is unavailable. Joining secure fallback consultation room.');
          }
        }

        if (isMounted) {
          setRoomName(fallbackRoomName);
        }
      } finally {
        if (isMounted) {
          setLoadingSession(false);
        }
      }
    };

    initializeConsultation();

    return () => {
      isMounted = false;
    };
  }, [appointmentId, fallbackRoomName]);

  const handleLeaveCall = async () => {
    try {
      if (sessionId) {
        await telemedicineService.endConsultation(sessionId);
      }
    } catch (error) {
      console.warn('Unable to end consultation session on server:', error);
    } finally {
      setIsCallActive(false);
      if (role === 'doctor') {
        navigate('/doctor/appointments');
      } else {
        navigate('/appointments');
      }
    }
  };

  if (loadingSession) {
    return (
      <div className="video-consultation loading-state">
        <div className="consultation-card">
          <h2>Preparing secure video consultation...</h2>
          <p>Please wait while we initialize your consultation room.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="video-consultation">
      <div className="consultation-header">
        <div>
          <h1>Video Consultation</h1>
          <p>
            {appointmentId ? `Appointment #${appointmentId}` : 'On-demand consultation room'}
          </p>
        </div>
        <div className="consultation-actions">
          <Button variant="secondary" onClick={handleLeaveCall}>Leave Consultation</Button>
        </div>
      </div>

      {sessionError && (
        <div className="consultation-warning">
          {sessionError}
        </div>
      )}

      <div className="consultation-meta">
        <span><strong>Room:</strong> {roomName}</span>
        <span><strong>Participant:</strong> {displayName}</span>
        {consultationMeta?.doctorName && <span><strong>Doctor:</strong> {consultationMeta.doctorName}</span>}
      </div>

      <div className="video-container">
        <JitsiMeeting
          domain="meet.jit.si"
          roomName={roomName}
          configOverwrite={{
            prejoinPageEnabled: true,
            startWithAudioMuted: false,
            startWithVideoMuted: false,
            disableModeratorIndicator: false,
            enableWelcomePage: false,
            resolution: 720
          }}
          interfaceConfigOverwrite={{
            DISABLE_JOIN_LEAVE_NOTIFICATIONS: true,
            MOBILE_APP_PROMO: false,
            SHOW_JITSI_WATERMARK: false,
            SHOW_WATERMARK_FOR_GUESTS: false
          }}
          userInfo={{
            displayName,
            email: user?.email || ''
          }}
          spinner={() => (
            <div className="jitsi-loader">
              <p>Connecting to secure video room...</p>
            </div>
          )}
          onApiReady={(externalApi) => {
            externalApi.addListener('videoConferenceJoined', () => setIsCallActive(true));
            externalApi.addListener('videoConferenceLeft', () => setIsCallActive(false));
          }}
          getIFrameRef={(node) => {
            node.style.width = '100%';
            node.style.height = '100%';
            node.style.border = '0';
            node.style.borderRadius = '16px';
          }}
        />
      </div>

      <div className="consultation-footer-note">
        {isCallActive
          ? 'Consultation is live. Please keep your mic muted when not speaking.'
          : 'Join the room above to start your consultation.'}
      </div>
    </div>
  );
};

export default VideoConsultation;