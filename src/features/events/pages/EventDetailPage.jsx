import { EventInvitationsPanel } from '../components/EventInvitationsPanel.jsx';
import { EventParticipantsPanel } from '../components/EventParticipantsPanel.jsx';
import { EventVenueBookingPanel } from '../components/EventVenueBookingPanel.jsx';
import { EventFollowupPanel } from '../components/EventFollowupPanel.jsx';
import { useProductConfiguration } from '@/shared/hooks/useProductConfiguration.js';
import { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { X } from 'lucide-react';
import SiteChrome from '@/shared/components/SiteChrome.jsx';
import EventExperience from '../components/EventExperience.jsx';
import { VenueBookingConversation } from '@/features/venues/index.js';
import { ForumDiscussion } from '@/features/discussions/index.js';
import EventRepresentatives from '../components/EventRepresentatives.jsx';
import { apiFetch } from '@/shared/api/client.js';
import { deviceTimezone, localDateTimeForZone, localDateTimeToUtc } from '@/shared/utils/time.js';
import {
  eventLocation,
  eventLocationText,
  eventDateTimeLabel,
  browserDate,
  ratingStars,
  participantPictureUrl,
  personPicture,
  replaceWithInitial,
  confirmPayment,
} from '../model/event-detail.js';
import { PaidEventFinancialConsole } from '../components/PaidEventFinancialConsole.jsx';
export function EventDetailPage() {
  const product = useProductConfiguration();
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const manageView = searchParams.get('manage') === '1';
  const token = localStorage.getItem('authToken');
  const user = JSON.parse(localStorage.getItem('authUser') || 'null');
  const [event, setEvent] = useState(null);
  const [, setImageLoaded] = useState(false);
  const [loading, setLoading] = useState(true);
  const [ratingSaving, setRatingSaving] = useState(false);
  const canManageEvents = Boolean(
    manageView &&
    token &&
    (['manager', 'admin'].includes(user?.role) ||
      (user?.id != null &&
        event?.managerId != null &&
        String(event.managerId) === String(user.id))),
  );
  const sanitizeParticipants = (value) => {
    if (canManageEvents || !value?.participants) return value;
    return {
      ...value,
      participants: value.participants.map((participant) => ({
        ...participant,
        isCurrentUser:
          participant.isCurrentUser ||
          (participant.email && participant.email === user?.email) ||
          (participant.userId != null &&
            user?.id != null &&
            String(participant.userId) === String(user.id)) ||
          (participant.user_id != null &&
            user?.id != null &&
            String(participant.user_id) === String(user.id)),
        email: undefined,
        phone: undefined,
      })),
    };
  };
  const [attendance, setAttendance] = useState({});
  const [pendingWithdrawal, setPendingWithdrawal] = useState(false);
  const [, setParticipantStatuses] = useState([]);
  const [invitations, setInvitations] = useState([]);
  const [invitationStatuses, setInvitationStatuses] = useState([]);
  const [showInvitationConfirmation, setShowInvitationConfirmation] = useState(false);
  const [invitationSent, setInvitationSent] = useState(false);
  const [invitation, setInvitation] = useState({
    name: '',
    email: '',
  });
  const [invitationMessage, setInvitationMessage] = useState('');
  const [resendingInvitationId, setResendingInvitationId] = useState(null);
  const [pendingRegistration, setPendingRegistration] = useState(false);
  const [selectedFoodOptions, setSelectedFoodOptions] = useState([]);
  const [registrations, setRegistrations] = useState([]);
  const [ownRegistration, setOwnRegistration] = useState(null);
  const [, setStatuses] = useState([]);
  const [error, setError] = useState('');
  const [registrationStatus, setRegistrationStatus] = useState('');
  const [registered, setRegistered] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [confirmationBusy, setConfirmationBusy] = useState(false);
  const [confirmationMessage, setConfirmationMessage] = useState('');
  const [finishingEvent, setFinishingEvent] = useState(false);
  const [followups, setFollowups] = useState(null);
  const [followupDrafts, setFollowupDrafts] = useState({
    attended: {
      subject: '',
      body: '',
    },
    no_show: {
      subject: '',
      body: '',
    },
  });
  const [followupBusy, setFollowupBusy] = useState('');
  const [followupMessage, setFollowupMessage] = useState('');
  const [followupError, setFollowupError] = useState('');
  const [venues, setVenues] = useState([]);
  const [billingProfiles, setBillingProfiles] = useState([]);
  const [buyerBillingProfileId, setBuyerBillingProfileId] = useState('');
  const [selectedVenueId, setSelectedVenueId] = useState('');
  const [bookingSchedule, setBookingSchedule] = useState({
    loading: false,
    error: '',
    slots: [],
    timezone: '',
  });
  const [bookingTime, setBookingTime] = useState(null);
  const [bookingAvailabilityVersion, setBookingAvailabilityVersion] = useState(0);
  const [bookingSaving, setBookingSaving] = useState(false);
  useEffect(() => {
    if (!canManageEvents || !token) return;
    apiFetch('/api/me/billing-profiles', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then(async (response) => (response.ok ? response.json() : []))
      .then((data) => setBillingProfiles(Array.isArray(data) ? data : data.profiles || []))
      .catch(() => setBillingProfiles([]));
  }, [canManageEvents, token]);
  useEffect(() => {
    if (!error) return undefined;
    const timer = window.setTimeout(() => setError(''), 5000);
    return () => window.clearTimeout(timer);
  }, [error]);
  const refreshFollowups = async (prefill = false) => {
    const response = await apiFetch(`/api/events/${id}/followups`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Unable to load follow-up emails.');
    setFollowups(data);
    if (prefill)
      setFollowupDrafts({
        attended: data.templates.attended || {
          subject: `Thank you for joining ${event.title}`,
          body: 'Thank you for joining us. We hope you enjoyed the event and look forward to seeing you again.',
        },
        no_show: data.templates.no_show || {
          subject: `We missed you at ${event.title}`,
          body: 'We missed you at the event. We hope to see you another time.',
        },
      });
    return data;
  };
  useEffect(() => {
    if (!canManageEvents || event?.status !== 'Completed') return;
    refreshFollowups(true).catch((requestError) => setFollowupError(requestError.message));
  }, [canManageEvents, event?.status, id, token]);
  const sameIdentifier = (left, right) =>
    left !== undefined &&
    left !== null &&
    right !== undefined &&
    right !== null &&
    String(left) === String(right);
  const registrationMatchesEvent = (registration) =>
    Number(
      registration.eventId ??
        registration.event_id ??
        registration.event?.id ??
        registration.event?.eventId,
    ) === Number(id);
  const load = async () => {
    const headers = {
      Authorization: `Bearer ${token}`,
    };
    const eventResponse = await apiFetch(
      `/api/events/${id}`,
      token
        ? {
            headers,
          }
        : {},
    );
    const eventData = await eventResponse.json();
    if (!eventResponse.ok) throw new Error(eventData.error || 'Unable to load event.');
    if (canManageEvents) {
      const bookingResponse = await apiFetch(`/api/events/${id}/venue-booking`, {
        headers,
      });
      if (bookingResponse.ok) eventData.venueBooking = await bookingResponse.json();
    }
    const canRequestManagedParticipants = canManageEvents;
    const managedParticipantsResponse = canRequestManagedParticipants
      ? await apiFetch(`/api/events/${id}/participants`, {
          headers,
        })
      : null;
    const managedParticipants = managedParticipantsResponse?.ok
      ? await managedParticipantsResponse.json()
      : null;
    const publicParticipants = eventData.participants || [];
    const participants = (managedParticipants || publicParticipants)
      .map((participant) => {
        const publicParticipant = publicParticipants.find(
          (item) =>
            (item.id && participant.id && item.id === participant.id) ||
            (item.participantId &&
              participant.participantId &&
              item.participantId === participant.participantId) ||
            (item.name === participant.name && item.email === participant.email),
        );
        return personPicture(participant) || !publicParticipant
          ? participant
          : {
              ...participant,
              profilePicture: personPicture(publicParticipant),
            };
      })
      .sort(
        (a, b) =>
          (new Date(b.createdAt || b.joinedAt).getTime() || 0) -
          (new Date(a.createdAt || a.joinedAt).getTime() || 0),
      );
    setEvent({
      ...eventData,
      participants,
    });
    setAttendance(
      Object.fromEntries(
        participants.map((participant) => [participant.id, participant.status || 'Pending']),
      ),
    );
    if (canManageEvents) {
      const [
        response,
        statusResponse,
        invitationResponse,
        invitationStatusResponse,
        participantStatusResponse,
      ] = await Promise.all([
        apiFetch(`/api/events/${id}/registrations`, {
          headers,
        }),
        apiFetch('/api/registration-statuses'),
        apiFetch(`/api/events/${id}/invitations`, {
          headers,
        }),
        apiFetch('/api/invitation-statuses'),
        apiFetch('/api/participant-statuses'),
      ]);
      const data = await response.json();
      const statusData = await statusResponse.json();
      const invitationData = await invitationResponse.json();
      const invitationStatusData = await invitationStatusResponse.json();
      const participantStatusData = await participantStatusResponse.json();
      if (
        !response.ok ||
        !statusResponse.ok ||
        !invitationResponse.ok ||
        !invitationStatusResponse.ok ||
        !participantStatusResponse.ok
      )
        throw new Error(
          data.error || invitationData.error || 'Unable to load event management data.',
        );
      const managedRegistrations = [...data].sort(
        (a, b) => (new Date(b.createdAt).getTime() || 0) - (new Date(a.createdAt).getTime() || 0),
      );
      setRegistrations(
        managedRegistrations.filter((registration) => registration.status !== 'Confirmed'),
      );
      setEvent((current) =>
        current
          ? {
              ...current,
              participants: (current.participants || []).map((participant) => {
                const registration = managedRegistrations.find(
                  (item) =>
                    item.participantId === participant.id ||
                    item.name === participant.name ||
                    item.email === participant.email,
                );
                return registration
                  ? {
                      ...participant,
                      email: participant.email || registration.email,
                      phone: participant.phone || registration.phone,
                      profilePicture: personPicture(participant) || personPicture(registration),
                      paymentStatus:
                        participant.paymentStatus ||
                        participant.registrationPaymentStatus ||
                        registration.paymentStatus ||
                        registration.registrationPaymentStatus,
                    }
                  : participant;
              }),
            }
          : current,
      );
      setStatuses(statusData);
      setInvitations(
        [...invitationData].sort(
          (a, b) => (new Date(b.createdAt).getTime() || 0) - (new Date(a.createdAt).getTime() || 0),
        ),
      );
      setInvitationStatuses(invitationStatusData);
      setParticipantStatuses(participantStatusData);
    }
    if (token) {
      const response = await apiFetch('/api/my/registrations', {
        headers,
      });
      const data = await response.json();
      if (response.ok) {
        if (!canManageEvents)
          setRegistrations(
            [...data].sort(
              (a, b) =>
                (new Date(b.createdAt).getTime() || 0) - (new Date(a.createdAt).getTime() || 0),
            ),
          );
        const ownRegistration =
          data.find(registrationMatchesEvent) ||
          data.find((registration) =>
            participants.some((participant) =>
              sameIdentifier(
                participant.id ?? participant.participantId,
                registration.participantId ?? registration.participant_id,
              ),
            ),
          );
        setOwnRegistration(ownRegistration || null);
        setRegistrationStatus(ownRegistration?.status || '');
        setRegistered(
          Boolean(ownRegistration && String(ownRegistration.status).toLowerCase() !== 'withdrawn'),
        );
      }
    }
  };
  useEffect(() => {
    load()
      .catch((requestError) => setError(requestError.message))
      .finally(() => setLoading(false));
  }, [id, token, canManageEvents]);
  useEffect(() => {
    if (!canManageEvents) return;
    apiFetch('/api/venues', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Unable to load venues.');
        setVenues(
          (Array.isArray(data) ? data : data.venues || []).filter(
            (venue) => venue.isActive !== false,
          ),
        );
      })
      .catch((requestError) => setError(requestError.message));
  }, [canManageEvents, token]);
  const venueBooking = event?.venueBooking || event?.venue_booking || event?.booking;
  useEffect(() => {
    if (venueBooking?.buyerBillingProfileId)
      setBuyerBillingProfileId(String(venueBooking.buyerBillingProfileId));
  }, [venueBooking?.buyerBillingProfileId]);
  const scheduleVenueId =
    selectedVenueId || venueBooking?.venueId || event?.venue?.id || event?.venueId || '';
  const selectedVenue = venues.find((venue) => String(venue.id) === String(scheduleVenueId));
  const bookingTimezone =
    bookingSchedule.timezone ||
    venueBooking?.timezone ||
    selectedVenue?.timezone ||
    event?.venue?.timezone ||
    event?.timezone ||
    deviceTimezone();
  const bookingDate = browserDate(venueBooking?.startAt || event?.startsAt, bookingTimezone);
  const persistedBookingTime =
    venueBooking?.startAt && venueBooking?.endAt
      ? (() => {
          const toMinutes = (value) => {
            const [hours, minutes] = value.slice(11, 16).split(':').map(Number);
            return hours * 60 + minutes;
          };
          const start = localDateTimeForZone(venueBooking.startAt, bookingTimezone);
          const end = localDateTimeForZone(venueBooking.endAt, bookingTimezone);
          return start && end
            ? {
                start: toMinutes(start),
                end: toMinutes(end),
              }
            : null;
        })()
      : null;
  useEffect(() => {
    let cancelled = false;
    setBookingTime(null);
    if (!canManageEvents || !scheduleVenueId || !bookingDate) {
      setBookingSchedule({
        loading: false,
        error: bookingDate ? '' : 'Set an event date before requesting a venue.',
        slots: [],
        timezone: '',
      });
      return undefined;
    }
    setBookingSchedule({
      loading: true,
      error: '',
      slots: [],
      timezone: '',
    });
    apiFetch(
      `/api/venues/${scheduleVenueId}/availability?date=${encodeURIComponent(bookingDate)}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    )
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok)
          throw new Error(data.error || data.message || 'Unable to load venue availability.');
        if (!cancelled)
          setBookingSchedule({
            ...data,
            loading: false,
            error: '',
            slots: data.slots || data.availableIntervals || [],
            timezone: data.timezone || '',
          });
      })
      .catch(
        (requestError) =>
          !cancelled &&
          setBookingSchedule({
            loading: false,
            error: requestError.message,
            slots: [],
            timezone: '',
          }),
      );
    return () => {
      cancelled = true;
    };
  }, [bookingAvailabilityVersion, bookingDate, canManageEvents, scheduleVenueId, token]);
  const requestVenueBooking = async () => {
    if (!selectedVenueId) return setError('Choose a venue first.');
    if (!bookingTime) return setError('Choose an available start and end time first.');
    setBookingSaving(true);
    try {
      const toTime = (minutes) =>
        `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;
      const startsAtUtc = localDateTimeToUtc(
        `${bookingDate}T${toTime(bookingTime.start)}`,
        bookingTimezone,
      );
      const endsAtUtc = localDateTimeToUtc(
        `${bookingDate}T${toTime(bookingTime.end)}`,
        bookingTimezone,
        'end',
      );
      if (!startsAtUtc || !endsAtUtc)
        throw new Error(
          'This local time does not exist due to daylight saving time. Choose another time.',
        );
      const eventResponse = await apiFetch(`/api/events/${id}/schedule`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          startsAtUtc,
          endsAtUtc,
          venueId: Number(selectedVenueId),
        }),
      });
      const eventData = await eventResponse.json();
      if (!eventResponse.ok)
        throw new Error(eventData.error || eventData.message || 'Unable to set the event time.');
      const response = await apiFetch(`/api/events/${id}/venue-booking`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          venueId: Number(selectedVenueId),
          buyerBillingProfileId: buyerBillingProfileId || null,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        if (response.status === 409) {
          setBookingTime(null);
          setBookingAvailabilityVersion((version) => version + 1);
        }
        throw new Error(
          data.error ||
            data.message ||
            'That time is no longer available. Please choose another time.',
        );
      }
      setEvent((current) => ({
        ...current,
        ...(eventData.event || eventData),
        venueBooking: data.booking || data,
      }));
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBookingSaving(false);
    }
  };
  const updateVenueBookingBuyer = async () => {
    if (!buyerBillingProfileId) return setError('Choose who is paying for this Venue.');
    setBookingSaving(true);
    try {
      const response = await apiFetch(
        `/api/venue-bookings/${venueBooking.id}/buyer-billing-profile`,
        {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            buyerBillingProfileId: Number(buyerBillingProfileId),
          }),
        },
      );
      const data = await response.json();
      if (!response.ok)
        throw new Error(data.error || data.message || 'Unable to update the booking buyer.');
      setEvent((current) => ({
        ...current,
        venueBooking: data.booking || current.venueBooking,
      }));
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBookingSaving(false);
    }
  };
  const cancelVenueBooking = async () => {
    setBookingSaving(true);
    try {
      const response = await apiFetch(`/api/events/${id}/venue-booking/cancel`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (!response.ok)
        throw new Error(data.error || data.message || 'Unable to cancel venue booking.');
      setEvent((current) => ({
        ...current,
        venueBooking: data.booking || {
          ...venueBooking,
          status: 'cancelled',
        },
      }));
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBookingSaving(false);
    }
  };
  useEffect(() => setImageLoaded(false), [id, event?.coverImage, event?.coverImageUrl]);
  useEffect(() => {
    setEvent((current) => sanitizeParticipants(current));
  }, [canManageEvents]);
  useEffect(() => {
    event?.participants?.forEach((participant) => {
      const participantsSection = [...document.querySelectorAll('section')].find(
        (section) => section.querySelector('h2')?.textContent === 'Participants',
      );
      const nameNode = [...(participantsSection?.querySelectorAll('p') || [])].find(
        (node) =>
          node.textContent === participant.name &&
          !node.previousElementSibling?.classList.contains('participant-avatar'),
      );
      if (!nameNode) return;
      const participantPaymentStatus =
        participant.paymentStatus ||
        registrations.find((registration) => registration.participantId === participant.id)
          ?.paymentStatus;
      const hasPaymentDetails = nameNode.parentElement?.querySelector('.participant-payment');
      if (
        nameNode.parentElement?.querySelector('.participant-avatar') &&
        (!canManageEvents || event?.fee <= 0 || hasPaymentDetails)
      )
        return;
      const picture = personPicture(participant);
      const avatar = picture ? document.createElement('img') : document.createElement('div');
      avatar.className =
        'participant-avatar mr-3 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full object-cover align-middle';
      if (picture) {
        avatar.src = participantPictureUrl(picture);
        avatar.alt = '';
        avatar.onerror = () => {
          avatar.onerror = null;
          replaceWithInitial(avatar, participant.name);
        };
      } else {
        avatar.textContent = participant.name?.charAt(0)?.toUpperCase() || '?';
        avatar.className += ' bg-secondary text-lg';
      }
      const card = nameNode.parentNode;
      const details = nameNode.parentElement;
      details.querySelector('.participant-avatar')?.remove();
      details.insertBefore(avatar, nameNode);
      card.classList.add('items-start', 'participant-details');
      if (
        canManageEvents &&
        event?.fee > 0 &&
        participantPaymentStatus &&
        participantPaymentStatus !== 'Not Required'
      ) {
        const payment = document.createElement('p');
        payment.className = `participant-payment mt-2 text-xs font-medium ${participantPaymentStatus === 'Paid' ? 'text-green-700' : 'text-red-700'}`;
        payment.textContent = participantPaymentStatus === 'Paid' ? 'Paid' : 'Payment Required';
        details.appendChild(payment);
        const paymentSelect = document.createElement('select');
        paymentSelect.className = 'hidden';
        paymentSelect.disabled = true;
        ['Not Required', 'Payment Required'].forEach((status) => {
          const option = document.createElement('option');
          option.value = status;
          option.textContent = status;
          option.selected = status === participantPaymentStatus;
          paymentSelect.appendChild(option);
        });
        if (participantPaymentStatus === 'Paid') {
          const option = document.createElement('option');
          option.value = 'Paid';
          option.textContent = 'Paid';
          option.selected = true;
          paymentSelect.appendChild(option);
        }
        paymentSelect.onchange = async () => {
          paymentSelect.disabled = true;
          try {
            const response = await apiFetch(`/api/participants/${participant.id}/payment-status`, {
              method: 'PATCH',
              headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                status: paymentSelect.value,
              }),
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || 'Unable to update payment status.');
            payment.textContent = `Payment: ${data.status || paymentSelect.value}`;
          } catch (requestError) {
            setError(requestError.message);
            paymentSelect.value = participantPaymentStatus;
          } finally {
            paymentSelect.disabled = false;
          }
        };
        details.appendChild(paymentSelect);
        if (event?.fee > 0 && participantPaymentStatus === 'Payment Required') {
          const paidButton = document.createElement('button');
          paidButton.type = 'button';
          paidButton.textContent = 'Mark as Paid';
          paidButton.className =
            'mt-2 inline-flex min-h-9 items-center justify-center border border-primary px-3 text-xs uppercase tracking-widest text-primary';
          paidButton.onclick = async () => {
            if (!(await confirmPayment())) return;
            paidButton.disabled = true;
            try {
              const response = await apiFetch(
                `/api/participants/${participant.id}/payment-status`,
                {
                  method: 'PATCH',
                  headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({
                    status: 'Paid',
                  }),
                },
              );
              const data = await response.json();
              if (!response.ok) throw new Error(data.error || 'Unable to update payment status.');
              payment.textContent = `Payment: ${data.status || 'Paid'}`;
              payment.className = 'participant-payment mt-2 text-xs font-medium text-green-700';
              paymentSelect.value = 'Paid';
              paymentSelect.disabled = true;
              paidButton.remove();
            } catch (requestError) {
              setError(requestError.message);
              paidButton.disabled = false;
            }
          };
          details.appendChild(paidButton);
        }
      }
    });
  }, [event?.participants, event?.fee, canManageEvents, registrations]);
  useEffect(() => {
    registrations.forEach((registration) => {
      const registrationsSection = [...document.querySelectorAll('section')].find(
        (section) => section.querySelector('h2')?.textContent === 'Registrations',
      );
      const nameNode = [...(registrationsSection?.querySelectorAll('p') || [])].find(
        (node) => node.textContent === registration.name,
      );
      if (!nameNode) return;
      if (nameNode.parentElement?.querySelector('.registration-avatar')) return;
      let card = nameNode.parentElement;
      while (card && !card.textContent.includes('Confirm')) card = card.parentElement;
      if (
        !card ||
        card.querySelector('.registration-avatar') ||
        card.querySelector('.registration-payment')
      )
        return;
      const picture = personPicture(registration);
      const avatar = picture ? document.createElement('img') : document.createElement('div');
      avatar.className =
        'registration-avatar mr-3 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full object-cover align-middle';
      if (picture) {
        avatar.src = participantPictureUrl(picture);
        avatar.alt = '';
        avatar.onerror = () => {
          avatar.onerror = null;
          replaceWithInitial(avatar, registration.name);
        };
      } else {
        avatar.textContent = registration.name?.charAt(0)?.toUpperCase() || '?';
        avatar.className += ' bg-secondary text-lg';
      }
      nameNode.parentNode.insertBefore(avatar, nameNode);
      if (canManageEvents && event?.fee > 0) {
        const payment = document.createElement('span');
        const registrationPaymentStatus = registration.paymentStatus || 'Payment Required';
        payment.className = `registration-payment ml-auto text-xs font-medium ${registrationPaymentStatus === 'Paid' ? 'text-green-700' : 'text-red-700'}`;
        payment.textContent = registrationPaymentStatus === 'Paid' ? 'Paid' : 'Payment Required';
        card.classList.add('items-center');
        card.appendChild(payment);
        if (registrationPaymentStatus === 'Payment Required') {
          const paidButton = document.createElement('button');
          paidButton.type = 'button';
          paidButton.textContent = 'Mark as Paid';
          paidButton.className =
            'inline-flex min-h-9 items-center justify-center border border-primary px-3 text-xs uppercase tracking-widest text-primary';
          paidButton.onclick = async () => {
            if (!(await confirmPayment())) return;
            paidButton.disabled = true;
            try {
              const response = await apiFetch(
                `/api/registrations/${registration.id}/payment-status`,
                {
                  method: 'PATCH',
                  headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({
                    status: 'Paid',
                  }),
                },
              );
              const data = await response.json();
              if (!response.ok) throw new Error(data.error || 'Unable to update payment status.');
              payment.textContent = `Payment: ${data.status || 'Paid'}`;
              payment.className = 'registration-payment ml-auto text-xs font-medium text-green-700';
              paidButton.remove();
            } catch (requestError) {
              setError(requestError.message);
              paidButton.disabled = false;
            }
          };
          card.appendChild(paidButton);
        }
      }
    });
  }, [registrations, event?.fee, canManageEvents]);
  useEffect(() => {
    setEvent((current) =>
      current
        ? {
            ...current,
            location: current.location,
          }
        : current,
    );
  }, [event?.fee]);
  const register = () => {
    if (!token) {
      window.location.assign(`/login?from=${encodeURIComponent(window.location.pathname)}`);
      return;
    }
    setConfirmationMessage('Are you sure you want to register for this event?');
    setSelectedFoodOptions([]);
    setPendingRegistration(true);
    setShowConfirmation(true);
  };
  const closeConfirmation = () => {
    if (confirmationBusy) return;
    setShowConfirmation(false);
    setPendingRegistration(false);
    setPendingWithdrawal(false);
    setConfirmationMessage('');
  };
  const confirmRegistration = async () => {
    if (confirmationBusy) return;
    setConfirmationBusy(true);
    try {
      const response = await apiFetch(`/api/events/${id}/registrations`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          selectedFoodOptions,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Unable to register for event.');
      setRegistered(true);
      setRegistrationStatus('Pending');
      setPendingRegistration(false);
      setConfirmationMessage(
        'Your registration request has been sent. The event organiser will review it and contact you with the outcome.',
      );
      try {
        await load();
      } catch {
        setError('Registration succeeded, but event details could not refresh.');
      }
    } catch (requestError) {
      setError(requestError.message || 'Unable to register for event.');
      setShowConfirmation(false);
      setPendingRegistration(false);
    } finally {
      setConfirmationBusy(false);
    }
  };
  const withdraw = () => {
    confirmWithdrawal();
  };
  const confirmWithdrawal = async () => {
    const response = await apiFetch(`/api/events/${id}/withdraw`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    const data = await response.json();
    if (!response.ok) {
      setError(data.error || 'Unable to withdraw registration.');
      setShowConfirmation(false);
      return;
    }
    setRegistered(false);
    setRegistrationStatus('Withdrawn');
    setOwnRegistration((current) =>
      current
        ? {
            ...current,
            status: data.status || 'Withdrawn',
          }
        : current,
    );
    setRegistrations((current) =>
      current.map((item) =>
        registrationMatchesEvent(item)
          ? {
              ...item,
              status: data.status || 'Withdrawn',
            }
          : item,
      ),
    );
    await load();
    setPendingWithdrawal(false);
    setConfirmationMessage('Your participation in this event has been withdrawn.');
    setShowConfirmation(true);
  };
  const sendInvitation = (submitEvent) => {
    submitEvent.preventDefault();
    setInvitationSent(false);
    setInvitationMessage(`Send an invitation to ${invitation.name} at ${invitation.email}?`);
    setShowInvitationConfirmation(true);
  };
  const confirmInvitation = async () => {
    setInvitationMessage('Sending invitation...');
    const response = await apiFetch(`/api/events/${id}/invitations`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(invitation),
    });
    const data = await response.json();
    if (!response.ok) {
      setInvitationMessage(data.error || 'Unable to send invitation.');
      return;
    }
    setInvitation({
      name: '',
      email: '',
    });
    await load();
    setInvitationSent(true);
    setInvitationMessage('Invitation sent successfully.');
  };
  const updateParticipantStatus = async (participantId, status) => {
    const response = await apiFetch(`/api/participants/${participantId}/status`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        status,
      }),
    });
    const data = await response.json();
    if (!response.ok) {
      setError(data.error || 'Unable to update participant status.');
      return;
    }
    setAttendance((current) => ({
      ...current,
      [participantId]: status,
    }));
    load().catch((requestError) => setError(requestError.message));
    if (event?.status === 'Completed')
      refreshFollowups().catch((requestError) => setFollowupError(requestError.message));
  };
  const updateInvitationStatus = async (invitationId, status) => {
    const response = await apiFetch(`/api/events/${id}/invitations/${invitationId}/status`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        status,
      }),
    });
    const data = await response.json();
    if (!response.ok) {
      setError(data.error || 'Unable to update invitation.');
      return;
    }
    load().catch((requestError) => setError(requestError.message));
  };
  const resendInvitation = async (invitationId) => {
    setResendingInvitationId(invitationId);
    setError('');
    try {
      const response = await apiFetch(`/api/events/${id}/invitations/${invitationId}/resend`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Unable to resend invitation.');
      setInvitationMessage(data.message || 'Invitation resent.');
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setResendingInvitationId(null);
    }
  };
  const markRegistrationPaid = async (registrationId) => {
    if (!(await confirmPayment())) return;
    const response = await apiFetch(`/api/registrations/${registrationId}/payment-status`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        status: 'Paid',
      }),
    });
    const data = await response.json();
    if (!response.ok) return setError(data.error || 'Unable to update payment status.');
    setRegistrations((current) =>
      current.map((registration) =>
        registration.id === registrationId
          ? {
              ...registration,
              paymentStatus: data.status || 'Paid',
            }
          : registration,
      ),
    );
  };
  const participantPaymentStatus = (participant) => {
    const registration = registrations.find(
      (item) =>
        sameIdentifier(
          item.participantId ?? item.participant_id,
          participant.id ?? participant.participantId,
        ) ||
        (item.name && participant.name && item.name === participant.name),
    );
    return (
      participant.paymentStatus ||
      participant.registrationPaymentStatus ||
      registration?.paymentStatus ||
      registration?.registrationPaymentStatus ||
      (event?.fee > 0 ? 'Payment Required' : 'Not Required')
    );
  };
  const markParticipantPaid = async (participantId) => {
    if (!(await confirmPayment())) return;
    const response = await apiFetch(`/api/participants/${participantId}/payment-status`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        status: 'Paid',
      }),
    });
    const data = await response.json();
    if (!response.ok) {
      setError(data.error || 'Unable to update payment status.');
      return;
    }
    setEvent((current) =>
      current
        ? {
            ...current,
            participants: (current.participants || []).map((participant) =>
              sameIdentifier(participant.id, participantId)
                ? {
                    ...participant,
                    paymentStatus: data.status || 'Paid',
                  }
                : participant,
            ),
          }
        : current,
    );
  };
  const updateStatus = async (registrationId, status) => {
    const response = await apiFetch(`/api/registrations/${registrationId}/status`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        status,
      }),
    });
    const data = await response.json();
    if (!response.ok) {
      setError(data.error || 'Unable to update registration.');
      return;
    }
    load().catch((requestError) => setError(requestError.message));
  };
  const isCurrentParticipant = (participant) => {
    const currentRegistration = ownRegistration || registrations.find(registrationMatchesEvent);
    return Boolean(
      user &&
      (participant.isCurrentUser ||
        sameIdentifier(participant.userId ?? participant.user_id, user.id) ||
        sameIdentifier(
          participant.id,
          currentRegistration?.participantId ?? currentRegistration?.participant_id,
        ) ||
        sameIdentifier(
          participant.participantId,
          currentRegistration?.participantId ?? currentRegistration?.participant_id,
        ) ||
        (participant.email && participant.email === user.email)),
    );
  };
  const currentUserParticipates =
    registered ||
    (!registrations.some(registrationMatchesEvent) &&
      Boolean(event?.participants?.some(isCurrentParticipant)));
  const currentParticipant = event?.participants?.find(isCurrentParticipant);
  const currentParticipantAttendance = String(
    event?.myParticipantStatus ??
      attendance[currentParticipant?.id] ??
      currentParticipant?.status ??
      '',
  )
    .replace(/\s/g, '')
    .toLowerCase();
  const canWithdraw =
    currentUserParticipates && !['attended', 'noshow'].includes(currentParticipantAttendance);
  const canRate = Boolean(token && currentParticipantAttendance === 'attended');
  const saveRating = async (rating) => {
    if (!canRate || ratingSaving) return;
    setRatingSaving(true);
    setError('');
    try {
      const response = await apiFetch(`/api/events/${id}/rating`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          rating,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Unable to save your rating.');
      setEvent((current) =>
        current
          ? {
              ...current,
              ...data,
            }
          : current,
      );
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setRatingSaving(false);
    }
  };
  const finishEvent = async () => {
    if (finishingEvent) return;
    setFinishingEvent(true);
    setFollowupError('');
    try {
      const response = await apiFetch(`/api/events/${id}/status`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: 'Completed',
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Unable to finish event.');
      setEvent((current) => ({
        ...current,
        status: 'Completed',
      }));
      setFollowupMessage(
        'Event marked finished. Review attendance before sending follow-up emails.',
      );
    } catch (requestError) {
      setFollowupError(requestError.message);
    } finally {
      setFinishingEvent(false);
    }
  };
  const saveFollowup = async (audience) => {
    setFollowupBusy(audience);
    setFollowupError('');
    setFollowupMessage('');
    try {
      const response = await apiFetch(`/api/events/${id}/followups/${audience}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(followupDrafts[audience]),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Unable to save message.');
      setFollowups(data);
      setFollowupMessage('Follow-up message saved. Check the audience before sending.');
    } catch (requestError) {
      setFollowupError(requestError.message);
    } finally {
      setFollowupBusy('');
    }
  };
  const sendFollowup = async (audience) => {
    setFollowupBusy(audience);
    setFollowupError('');
    setFollowupMessage('');
    try {
      const response = await apiFetch(`/api/events/${id}/followups/${audience}/send`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Unable to send messages.');
      setFollowups(data);
      setFollowupMessage(
        `${data.sent} email${data.sent === 1 ? '' : 's'} sent${data.failed ? `; ${data.failed} failed and can be retried` : ''}.`,
      );
    } catch (requestError) {
      setFollowupError(requestError.message);
    } finally {
      setFollowupBusy('');
    }
  };
  return (
    <SiteChrome>
      <Helmet>
        <title>{event?.title || 'Event'} | YKCircle</title>
      </Helmet>
      <section className="mx-auto max-w-[72rem] px-5 pb-24 pt-10 sm:px-8 sm:pt-14">
        <Link
          to={manageView ? '/profile/events' : '/events'}
          className="inline-flex min-h-11 items-center text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
        >
          Back to {manageView ? 'manage events' : 'all events'}
        </Link>
        {loading && (
          <div className="mt-12 flex items-center gap-3 text-muted-foreground">
            <span
              className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent"
              aria-hidden="true"
            />
            Loading event details…
          </div>
        )}
        {error && (
          <p
            role="alert"
            className="fixed bottom-6 left-5 z-50 max-w-md border border-destructive/30 bg-background px-4 py-3 text-sm text-destructive shadow-lg sm:left-auto sm:right-6"
          >
            {error}
          </p>
        )}
        {event && (
          <>
            <EventExperience
              key={event.id}
              event={event}
              location={eventLocation(event)}
              locationText={
                venueBooking?.status === 'confirmed'
                  ? venueBooking.venue?.name ||
                    venueBooking.venueName ||
                    event.venue?.name ||
                    eventLocationText(event)
                  : eventLocationText(event)
              }
              dateLabel={eventDateTimeLabel(event)}
              canManage={canManageEvents}
              participates={currentUserParticipates}
              registrationStatus={registrationStatus}
              canWithdraw={canWithdraw}
              onRegister={register}
              onWithdraw={withdraw}
            />
            {canManageEvents && ['Published', 'Completed'].includes(event.status) && (
              <EventFollowupPanel
                event={event}
                finishEvent={finishEvent}
                finishingEvent={finishingEvent}
                followups={followups}
                followupDrafts={followupDrafts}
                followupBusy={followupBusy}
                setFollowupDrafts={setFollowupDrafts}
                saveFollowup={saveFollowup}
                sendFollowup={sendFollowup}
                followupMessage={followupMessage}
                followupError={followupError}
              />
            )}
            {canManageEvents && (
              <EventVenueBookingPanel
                venueBooking={venueBooking}
                product={product}
                persistedBookingTime={persistedBookingTime}
                bookingSchedule={bookingSchedule}
                billingProfiles={billingProfiles}
                buyerBillingProfileId={buyerBillingProfileId}
                setBuyerBillingProfileId={setBuyerBillingProfileId}
                setBillingProfiles={setBillingProfiles}
                bookingSaving={bookingSaving}
                updateVenueBookingBuyer={updateVenueBookingBuyer}
                cancelVenueBooking={cancelVenueBooking}
                selectedVenueId={selectedVenueId}
                setSelectedVenueId={setSelectedVenueId}
                venues={venues}
                bookingTime={bookingTime}
                setBookingTime={setBookingTime}
                requestVenueBooking={requestVenueBooking}
              />
            )}
            {canManageEvents && (
              <EventRepresentatives key={event.id} eventId={event.id} token={token} />
            )}
            {canManageEvents && (event.pricingType === 'paid' || Number(event.fee || 0) > 0) && (
              <PaidEventFinancialConsole
                onProfileCreated={(saved) =>
                  setBillingProfiles((current) => [
                    ...current.filter((item) => item.id !== saved.id),
                    saved,
                  ])
                }
                eventId={event.id}
                token={token}
                currency={event.currency || 'SEK'}
                billingProfiles={billingProfiles}
              />
            )}
            {canManageEvents && venueBooking?.id && (
              <div className="mt-5 max-w-2xl">
                <VenueBookingConversation bookingId={venueBooking.id} />
              </div>
            )}
            {token && Number(event.myRating) > 0 && !canRate && (
              <section className="rounded-2xl mt-8 border border-border p-5">
                <h2 className="font-display text-2xl font-semibold">Your rating</h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  <span className="text-primary" aria-hidden="true">
                    {ratingStars(event.myRating)}
                  </span>{' '}
                  You rated this event {event.myRating} / 5.
                </p>
              </section>
            )}
            {canRate && (
              <section className="rounded-2xl mt-8 border border-border p-5">
                <h2 className="font-display text-2xl font-semibold">Rate this event</h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  Your rating is visible in the event and group averages. You can change it later.
                </p>
                <div
                  className="mt-4 flex flex-wrap gap-2"
                  role="group"
                  aria-label="Choose a rating from one to five"
                >
                  {[1, 2, 3, 4, 5].map((rating) => (
                    <button
                      key={rating}
                      type="button"
                      disabled={ratingSaving}
                      onClick={() => saveRating(rating)}
                      aria-label={`${rating} stars`}
                      aria-pressed={Number(event.myRating) === rating}
                      className={`ui-action min-h-11 min-w-11 border px-3 text-sm disabled:opacity-50 ${Number(event.myRating) === rating ? 'border-primary bg-primary text-primary-foreground' : 'border-border text-primary'}`}
                    >
                      {ratingStars(rating)}
                    </button>
                  ))}
                </div>
              </section>
            )}
            {
              <EventParticipantsPanel
                canManageEvents={canManageEvents}
                event={event}
                token={token}
                setAttendance={setAttendance}
                setEvent={setEvent}
                setRegistrations={setRegistrations}
                isCurrentParticipant={isCurrentParticipant}
                participantPaymentStatus={participantPaymentStatus}
                markParticipantPaid={markParticipantPaid}
                attendance={attendance}
                updateParticipantStatus={updateParticipantStatus}
              />
            }
            <div className="mt-5">
              <Link
                to={`/report?entityType=event&entityId=${encodeURIComponent(event.id)}&contentUrl=${encodeURIComponent(window.location.href)}`}
                className="ui-action inline-flex min-h-10 items-center border border-border px-4 text-xs uppercase tracking-widest text-muted-foreground hover:border-destructive hover:text-destructive"
              >
                Report event
              </Link>
            </div>
            {(canManageEvents || currentUserParticipates) && (
              <ForumDiscussion
                title="Event discussion"
                basePath={`/api/events/${event.id}/threads`}
                token={token}
                canPost={Boolean(token)}
                canModerate={canManageEvents}
                emptyText="No event discussions yet."
              />
            )}
            {canManageEvents && (
              <EventInvitationsPanel
                sendInvitation={sendInvitation}
                invitation={invitation}
                setInvitation={setInvitation}
                invitationMessage={invitationMessage}
                invitations={invitations}
                updateInvitationStatus={updateInvitationStatus}
                invitationStatuses={invitationStatuses}
                resendInvitation={resendInvitation}
                resendingInvitationId={resendingInvitationId}
                registrations={registrations}
                event={event}
                markRegistrationPaid={markRegistrationPaid}
                updateStatus={updateStatus}
              />
            )}
          </>
        )}
      </section>
      {showInvitationConfirmation && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 px-5"
          role="dialog"
          aria-modal="true"
        >
          <div className="rounded-2xl w-full max-w-md bg-background p-8 shadow-xl">
            <h2 className="font-display text-3xl font-semibold">
              {invitationSent ? 'Invitation sent' : 'Confirm invitation'}
            </h2>
            <p className="mt-4 text-muted-foreground">{invitationMessage}</p>
            <button
              onClick={
                invitationSent ? () => setShowInvitationConfirmation(false) : confirmInvitation
              }
              className="ui-action mt-7 min-h-12 bg-primary px-7 text-sm uppercase tracking-widest text-primary-foreground"
            >
              {invitationSent ? 'Done' : 'Send invitation'}
            </button>
          </div>
        </div>
      )}
      {showConfirmation && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 px-5"
          role="dialog"
          aria-modal="true"
        >
          <div className="rounded-2xl relative max-h-[90dvh] w-full max-w-md overflow-y-auto bg-background p-8 shadow-xl">
            <button
              type="button"
              onClick={closeConfirmation}
              disabled={confirmationBusy}
              aria-label="Close confirmation"
              className="absolute right-4 top-4 inline-flex h-10 w-10 items-center justify-center text-muted-foreground hover:text-foreground disabled:opacity-50"
            >
              <X className="h-5 w-5" aria-hidden="true" />
            </button>
            <h2 className="pr-8 font-display text-3xl font-semibold">
              {pendingWithdrawal
                ? 'Confirm withdrawal'
                : pendingRegistration
                  ? 'Confirm registration'
                  : confirmationMessage.includes('withdrawn')
                    ? 'Participation withdrawn'
                    : confirmationMessage.includes('review it')
                      ? 'Registration request sent'
                      : 'You are registered'}
            </h2>
            <p className="mt-4 text-muted-foreground">{confirmationMessage}</p>
            {pendingRegistration &&
              Array.isArray(event?.foodOptions) &&
              event.foodOptions.length > 0 && (
                <fieldset
                  disabled={confirmationBusy}
                  className="mt-5 rounded-xl border border-border bg-secondary/20 p-4"
                >
                  <legend className="px-1 text-sm font-medium">Food options (optional)</legend>
                  <p className="text-sm text-muted-foreground">
                    Choose any options you would like. Your choices will be shared with the event
                    organizer.
                  </p>
                  <div className="mt-3 space-y-2">
                    {[...new Set(event.foodOptions)].map((option) => (
                      <label
                        key={option}
                        className="flex min-h-11 cursor-pointer items-center gap-3 rounded-lg px-2 py-2 hover:bg-secondary/50"
                      >
                        <input
                          type="checkbox"
                          checked={selectedFoodOptions.includes(option)}
                          onChange={(e) =>
                            setSelectedFoodOptions((current) =>
                              e.target.checked
                                ? [...current, option]
                                : current.filter((value) => value !== option),
                            )
                          }
                          className="h-4 w-4 shrink-0 accent-primary"
                        />
                        <span className="break-words text-sm">{option}</span>
                      </label>
                    ))}
                  </div>
                </fieldset>
              )}
            <div className="mt-7 flex flex-wrap gap-3">
              <button
                type="button"
                disabled={confirmationBusy}
                onClick={
                  pendingWithdrawal
                    ? confirmWithdrawal
                    : pendingRegistration
                      ? confirmRegistration
                      : closeConfirmation
                }
                className="ui-action min-h-12 bg-primary px-7 text-sm uppercase tracking-widest text-primary-foreground disabled:opacity-50"
              >
                {confirmationBusy
                  ? 'Please wait…'
                  : pendingWithdrawal
                    ? 'Confirm withdrawal'
                    : pendingRegistration
                      ? 'Confirm registration'
                      : 'Got it'}
              </button>
              {(pendingRegistration || pendingWithdrawal) && (
                <button
                  type="button"
                  disabled={confirmationBusy}
                  onClick={closeConfirmation}
                  className="ui-action min-h-12 border border-border px-7 text-sm uppercase tracking-widest disabled:opacity-50"
                >
                  Cancel
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </SiteChrome>
  );
}
export default EventDetailPage;
