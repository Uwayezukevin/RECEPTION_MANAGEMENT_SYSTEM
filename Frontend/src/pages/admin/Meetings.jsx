// src/pages/admin/Meetings.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import {
  FaCalendarAlt,
  FaPlus,
  FaSpinner,
  FaUsers,
  FaClock,
  FaMapMarkerAlt,
  FaUserTie,
  FaEye,
  FaFileDownload,
  FaCheckCircle,
  FaTimesCircle,
  FaPlayCircle,
  FaLink,
  FaQrcode,
  FaCopy,
  FaFilePdf,
  FaFileExcel,
  FaFileCode,
} from "react-icons/fa";
import { QRCodeSVG } from "qrcode.react";
import API from "../../service/api";
import toast from "react-hot-toast";

const Meetings = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMeeting, setSelectedMeeting] = useState(null);
  const [showParticipants, setShowParticipants] = useState(false);
  const [participants, setParticipants] = useState([]);
  const [showQRCode, setShowQRCode] = useState(null);
  const [filter, setFilter] = useState("all");
  const [exporting, setExporting] = useState(false);
  const [openExportMenu, setOpenExportMenu] = useState(null);

  useEffect(() => {
    fetchMeetings();
  }, []);

  // Close export menu when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      setOpenExportMenu(null);
    };
    document.addEventListener("click", handleClickOutside);
    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, []);

  const fetchMeetings = async () => {
    try {
      setLoading(true);
      const response = await API.getMeetings();
      console.log("Meetings response:", response.data);
      setMeetings(response.data.meetings || []);
    } catch (error) {
      console.error("Error fetching meetings:", error);
      toast.error("Failed to load meetings");
    } finally {
      setLoading(false);
    }
  };

  const updateMeetingStatus = async (meetingId, status) => {
    try {
      await API.updateMeetingStatus(meetingId, { status });
      toast.success(`Meeting marked as ${status}`);
      fetchMeetings();
    } catch (error) {
      console.error("Error updating status:", error);
      toast.error("Failed to update meeting status");
    }
  };

  const viewParticipants = async (meeting) => {
    try {
      console.log("Fetching participants for meeting:", meeting._id);
      const response = await API.getMeetingParticipants(meeting._id);
      console.log("Participants response:", response.data);

      setSelectedMeeting(meeting);
      setParticipants(response.data.participants || []);
      setShowParticipants(true);
    } catch (error) {
      console.error("Error fetching participants:", error);
      toast.error("Failed to load participants");
    }
  };

  const exportMeeting = async (meetingId, format) => {
    setExporting(true);
    try {
      let response;
      let filename = "";

      switch (format) {
        case "pdf":
          response = await API.exportMeetingToPDF(meetingId);
          filename = `meeting_export_${Date.now()}.pdf`;
          break;
        case "excel":
          response = await API.exportMeetingToExcel(meetingId);
          filename = `meeting_export_${Date.now()}.xlsx`;
          break;
        case "html":
          response = await API.exportMeetingToHTML(meetingId);
          filename = `meeting_export_${Date.now()}.html`;
          break;
        default:
          return;
      }

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      toast.success(`Meeting exported as ${format.toUpperCase()}`);
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Failed to export meeting");
    } finally {
      setExporting(false);
      setOpenExportMenu(null);
    }
  };

  const toggleExportMenu = (meetingId, e) => {
    e.stopPropagation();
    setOpenExportMenu(openExportMenu === meetingId ? null : meetingId);
  };

  const getSignInLink = (meetingId) => {
    return `${window.location.origin}/meeting/signin/${meetingId}`;
  };
  const getStatusBadge = (status) => {
    const badges = {
      scheduled: {
        bg: "bg-blue-100",
        text: "text-blue-700",
        icon: FaClock,
        label: "Scheduled",
      },
      ongoing: {
        bg: "bg-green-100",
        text: "text-green-700",
        icon: FaPlayCircle,
        label: "Ongoing",
      },
      completed: {
        bg: "bg-gray-100",
        text: "text-gray-700",
        icon: FaCheckCircle,
        label: "Completed",
      },
      cancelled: {
        bg: "bg-red-100",
        text: "text-red-700",
        icon: FaTimesCircle,
        label: "Cancelled",
      },
    };
    const badge = badges[status] || badges.scheduled;
    return (
      <span
        className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${badge.bg} ${badge.text}`}
      >
        <badge.icon className="text-xs" />
        {badge.label}
      </span>
    );
  };

  const filteredMeetings = meetings.filter((meeting) => {
    if (filter === "all") return true;
    return meeting.status === filter;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-600 via-primary-700 to-secondary-800 flex items-center justify-center">
        <div className="text-center">
          <FaSpinner className="animate-spin text-5xl text-white mx-auto mb-4" />
          <p className="text-white text-lg">Loading meetings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-600 via-primary-700 to-secondary-800 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white">
              Meeting Management
            </h1>
            <p className="text-white/80 mt-1">
              Schedule and manage company meetings
            </p>
          </div>
          <button
            onClick={() => navigate("/meetings/create")}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-white/10 backdrop-blur-md text-white rounded-xl hover:bg-white/20 transition-all border border-white/20"
          >
            <FaPlus />
            <span>Schedule Meeting</span>
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-6">
          {["all", "scheduled", "ongoing", "completed", "cancelled"].map(
            (status) => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`px-4 py-2 rounded-lg capitalize transition-all ${
                  filter === status
                    ? "bg-white text-primary-600 font-semibold shadow-lg"
                    : "bg-white/10 text-white hover:bg-white/20"
                }`}
              >
                {status}
              </button>
            ),
          )}
        </div>

        {/* Meetings Grid */}
        {filteredMeetings.length === 0 ? (
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-12 text-center">
            <FaCalendarAlt className="text-6xl text-white/40 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">
              No Meetings Found
            </h3>
            <p className="text-white/60 mb-6">
              No meetings match your current filter
            </p>
            <button
              onClick={() => navigate("/meetings/create")}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-white/10 backdrop-blur-md text-white rounded-xl hover:bg-white/20 transition-all"
            >
              <FaPlus />
              <span>Schedule Your First Meeting</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredMeetings.map((meeting) => (
              <div
                key={meeting._id}
                className="bg-white/10 backdrop-blur-lg rounded-2xl overflow-hidden hover:transform hover:scale-105 transition-all duration-300 border border-white/20"
              >
                {/* Meeting Header */}
                <div className="p-5 border-b border-white/20">
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="text-xl font-bold text-white">
                      {meeting.title}
                    </h3>
                    {getStatusBadge(meeting.status)}
                  </div>
                  <p className="text-white/70 text-sm line-clamp-2">
                    {meeting.description}
                  </p>
                </div>

                {/* Meeting Details */}
                <div className="p-5 space-y-3">
                  <div className="flex items-center gap-3 text-white/80 text-sm">
                    <FaCalendarAlt className="text-primary-400" />
                    <span>
                      {new Date(meeting.meetingDate).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-white/80 text-sm">
                    <FaClock className="text-primary-400" />
                    <span>
                      {meeting.startTime} - {meeting.endTime}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-white/80 text-sm">
                    <FaMapMarkerAlt className="text-primary-400" />
                    <span>{meeting.location}</span>
                  </div>
                  <div className="flex items-center gap-3 text-white/80 text-sm">
                    <FaUserTie className="text-primary-400" />
                    <span>{meeting.meetingLeader?.name}</span>
                  </div>
                  <div className="flex items-center gap-3 text-white/80 text-sm">
                    <FaUsers className="text-primary-400" />
                    <span>{meeting.participantCount || 0} participants</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="p-4 bg-black/20 flex flex-wrap gap-2">
                  <button
                    onClick={() => viewParticipants(meeting)}
                    className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 bg-blue-500/20 text-blue-200 rounded-lg hover:bg-blue-500/30 transition-all text-sm"
                  >
                    <FaEye />
                    <span>View</span>
                  </button>

                  <button
                    onClick={() => setShowQRCode(meeting)}
                    className="inline-flex items-center justify-center gap-2 px-3 py-2 bg-indigo-500/20 text-indigo-200 rounded-lg hover:bg-indigo-500/30 transition-all text-sm"
                    title="Show QR Code"
                  >
                    <FaQrcode />
                  </button>

                  <button
                    onClick={() => copySignInLink(meeting._id, meeting.title)}
                    className="inline-flex items-center justify-center gap-2 px-3 py-2 bg-purple-500/20 text-purple-200 rounded-lg hover:bg-purple-500/30 transition-all text-sm"
                    title="Copy link"
                  >
                    <FaLink />
                  </button>

                  {/* Export Dropdown - Fixed Version */}
                  <div className="relative">
                    <button
                      onClick={(e) => toggleExportMenu(meeting._id, e)}
                      className="inline-flex items-center justify-center gap-2 px-3 py-2 bg-green-500/20 text-green-200 rounded-lg hover:bg-green-500/30 transition-all text-sm"
                      disabled={exporting}
                    >
                      <FaFileDownload />
                      <span>Export</span>
                    </button>

                    {openExportMenu === meeting._id && (
                      <div className="absolute bottom-full left-0 mb-2 bg-gray-800 rounded-lg p-2 min-w-[140px] z-50 shadow-xl border border-gray-700">
                        <button
                          onClick={() => exportMeeting(meeting._id, "pdf")}
                          className="flex items-center gap-2 w-full px-3 py-2 text-sm text-white hover:bg-gray-700 rounded transition"
                        >
                          <FaFilePdf className="text-red-400" />
                          PDF
                        </button>
                        <button
                          onClick={() => exportMeeting(meeting._id, "html")}
                          className="flex items-center gap-2 w-full px-3 py-2 text-sm text-white hover:bg-gray-700 rounded transition"
                        >
                          <FaFileCode className="text-blue-400" />
                          HTML
                        </button>
                      </div>
                    )}
                  </div>

                  {meeting.status !== "completed" &&
                    meeting.status !== "cancelled" && (
                      <select
                        onChange={(e) =>
                          updateMeetingStatus(meeting._id, e.target.value)
                        }
                        value={meeting.status}
                        className="px-3 py-2 bg-white/10 text-white rounded-lg text-sm border border-white/20 focus:outline-none"
                      >
                        <option value="scheduled" className="text-gray-900">
                          Scheduled
                        </option>
                        <option value="ongoing" className="text-gray-900">
                          Ongoing
                        </option>
                        <option value="completed" className="text-gray-900">
                          Completed
                        </option>
                        <option value="cancelled" className="text-gray-900">
                          Cancelled
                        </option>
                      </select>
                    )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* QR Code Modal */}
      {showQRCode && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setShowQRCode(null)}
        >
          <div
            className="bg-white rounded-2xl p-6 text-center max-w-sm"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-xl font-bold mb-2">{showQRCode.title}</h3>
            <p className="text-gray-500 text-sm mb-4">
              Scan to sign in to this meeting
            </p>
            <QRCodeSVG
              value={getSignInLink(showQRCode._id)}
              size={200}
              className="mx-auto mb-4"
            />
            <button
              onClick={() => copySignInLink(showQRCode._id, showQRCode.title)}
              className="mt-2 w-full px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition flex items-center justify-center gap-2"
            >
              <FaCopy />
              Copy Link
            </button>
            <button
              onClick={() => setShowQRCode(null)}
              className="mt-2 w-full px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Participants Modal - IMPROVED SCROLLABLE VERSION */}
      {showParticipants && selectedMeeting && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setShowParticipants(false)}
        >
          <div
            className="bg-white rounded-2xl w-full max-w-4xl h-[85vh] flex flex-col shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header - Fixed */}
            <div className="bg-gradient-to-r from-primary-600 to-secondary-600 px-6 py-4 rounded-t-2xl flex justify-between items-center flex-shrink-0">
              <div>
                <h2 className="text-xl font-bold text-white">
                  Meeting Participants
                </h2>
                <p className="text-white/80 text-sm">{selectedMeeting.title}</p>
              </div>
              <button
                onClick={() => setShowParticipants(false)}
                className="text-white/80 hover:text-white text-2xl"
              >
                &times;
              </button>
            </div>

            {/* Stats Bar - Fixed */}
            <div className="bg-gray-50 px-6 py-3 border-b border-gray-200 flex justify-between items-center flex-shrink-0">
              <div className="flex items-center gap-2">
                <FaUsers className="text-primary-500" />
                <span className="font-semibold text-gray-700">
                  Total Participants:
                </span>
                <span className="bg-primary-100 text-primary-700 px-2 py-0.5 rounded-full text-sm font-bold">
                  {participants.length}
                </span>
              </div>
              <div className="text-sm text-gray-500">
                {participants.length > 0
                  ? `${participants.length} people attended`
                  : "No sign-ins yet"}
              </div>
            </div>

            {/* Scrollable Participants List */}
            <div className="flex-1 overflow-y-auto p-6">
              {participants.length > 0 ? (
                <div className="space-y-4">
                  {participants.map((participant, idx) => (
                    <div
                      key={idx}
                      className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-200 hover:border-primary-200"
                    >
                      {/* Participant Header */}
                      <div className="bg-gradient-to-r from-gray-50 to-white px-5 py-3 border-b border-gray-100 flex justify-between items-center">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-sm">
                            {idx + 1}
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-900">
                              {participant.fullName}
                            </h3>
                            <p className="text-xs text-gray-500">
                              {participant.position}
                            </p>
                          </div>
                        </div>
                        <div className="text-xs text-gray-400">#{idx + 1}</div>
                      </div>

                      {/* Participant Body */}
                      <div className="p-5">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
                          <div className="flex items-start gap-2">
                            <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
                              <svg
                                className="w-4 h-4 text-blue-500"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                                />
                              </svg>
                            </div>
                            <div>
                              <p className="text-xs text-gray-400 uppercase tracking-wide">
                                Institution
                              </p>
                              <p className="text-gray-800 font-medium mt-0.5">
                                {participant.institution}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-start gap-2">
                            <div className="w-8 h-8 bg-green-50 rounded-lg flex items-center justify-center flex-shrink-0">
                              <svg
                                className="w-4 h-4 text-green-500"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                                />
                              </svg>
                            </div>
                            <div>
                              <p className="text-xs text-gray-400 uppercase tracking-wide">
                                Position
                              </p>
                              <p className="text-gray-800 font-medium mt-0.5">
                                {participant.position}
                              </p>
                            </div>
                          </div>

                          {participant.email && (
                            <div className="flex items-start gap-2 col-span-1 md:col-span-2">
                              <div className="w-8 h-8 bg-purple-50 rounded-lg flex items-center justify-center flex-shrink-0">
                                <svg
                                  className="w-4 h-4 text-purple-500"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                                  />
                                </svg>
                              </div>
                              <div>
                                <p className="text-xs text-gray-400 uppercase tracking-wide">
                                  Email
                                </p>
                                <p className="text-gray-800 mt-0.5">
                                  {participant.email}
                                </p>
                              </div>
                            </div>
                          )}

                          <div className="flex items-start gap-2">
                            <div className="w-8 h-8 bg-orange-50 rounded-lg flex items-center justify-center flex-shrink-0">
                              <svg
                                className="w-4 h-4 text-orange-500"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                                />
                              </svg>
                            </div>
                            <div>
                              <p className="text-xs text-gray-400 uppercase tracking-wide">
                                Signed At
                              </p>
                              <p className="text-gray-800 mt-0.5">
                                {new Date(
                                  participant.signedAt,
                                ).toLocaleString()}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Signature Section */}
                        <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-4 border border-gray-200">
                          <p className="text-xs text-gray-500 uppercase tracking-wide mb-3 flex items-center gap-2">
                            <span className="text-lg">✍️</span> Digital
                            Signature
                          </p>
                          {participant.signature ? (
                            <div className="flex justify-center items-center min-h-[80px] bg-white rounded-lg p-3 border border-gray-200">
                              <img
                                src={participant.signature}
                                alt={`${participant.fullName}'s signature`}
                                className="max-w-full max-h-[80px] object-contain"
                                onError={(e) => {
                                  e.target.onerror = null;
                                  e.target.alt =
                                    "Signature image failed to load";
                                  e.target.parentElement.innerHTML =
                                    '<p class="text-gray-400 italic text-sm">Signature data unavailable</p>';
                                }}
                              />
                            </div>
                          ) : (
                            <div className="text-center py-6 bg-white rounded-lg">
                              <p className="text-gray-400 italic">
                                No signature provided
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center py-12">
                  <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                    <FaUsers className="text-4xl text-gray-400" />
                  </div>
                  <p className="text-gray-500 text-lg font-medium">
                    No participants yet
                  </p>
                  <p className="text-gray-400 text-sm mt-2 max-w-sm">
                    Share the QR code with participants so they can sign in to
                    this meeting
                  </p>
                </div>
              )}
            </div>

            {/* Footer - Fixed */}
            <div className="border-t border-gray-200 px-6 py-4 bg-gray-50 rounded-b-2xl flex justify-between items-center flex-shrink-0">
              <div className="text-xs text-gray-400">
                Total signed: {participants.length} participant
                {participants.length !== 1 ? "s" : ""}
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowParticipants(false)}
                  className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg transition text-sm"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Meetings;
