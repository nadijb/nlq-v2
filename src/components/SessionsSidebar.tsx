"use client";

import { useState, useEffect } from "react";
import { Session, SessionsListResponse } from "@/types/chat";

interface SessionsSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectSession: (sessionId: string) => void;
  onDeleteSession: (sessionId: string) => void;
  currentSessionId: string | null;
}

export default function SessionsSidebar({
  isOpen,
  onClose,
  onSelectSession,
  onDeleteSession,
  currentSessionId,
}: SessionsSidebarProps) {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchSessions = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/sessions");
      const data: SessionsListResponse = await response.json();

      if (data.status === "success" && data.data?.sessions) {
        setSessions(data.data.sessions);
      } else {
        setError(data.message || "Failed to load sessions");
      }
    } catch (err) {
      console.error("Error fetching sessions:", err);
      setError("Failed to load sessions");
    } finally {
      setIsLoading(false);
    }
  };

  const deleteSession = async (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();

    if (!confirm("Are you sure you want to delete this conversation?")) {
      return;
    }

    setDeletingId(sessionId);
    try {
      const response = await fetch(`/api/sessions?id=${sessionId}&delete=true`);
      const data = await response.json();

      if (data.status === "success") {
        setSessions((prev) => prev.filter((s) => s.session_id !== sessionId));
        if (currentSessionId === sessionId) {
          onDeleteSession(sessionId);
        }
      } else {
        alert("Failed to delete session");
      }
    } catch (err) {
      console.error("Error deleting session:", err);
      alert("Failed to delete session");
    } finally {
      setDeletingId(null);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchSessions();
    }
  }, [isOpen]);

  const formatSessionId = (sessionId: string) => {
    return (
      "Session " + sessionId.replace("session_", "").substring(0, 8) + "..."
    );
  };

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-40 md:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed top-0 left-0 h-full w-72 bg-white border-r border-gray-200 z-50 transform transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-primary">Chat History</h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Sessions List */}
        <div
          className="flex-1 overflow-y-auto p-4"
          style={{ height: "calc(100% - 130px)" }}
        >
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <p className="text-red-500 text-sm mb-3">{error}</p>
              <button
                onClick={fetchSessions}
                className="text-sm text-primary hover:underline"
              >
                Try again
              </button>
            </div>
          ) : sessions.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500 text-sm">No chat history yet</p>
            </div>
          ) : (
            <div className="space-y-2">
              {sessions.map((session) => (
                <div
                  key={session.session_id}
                  className={`group flex items-center rounded-lg transition-colors ${
                    currentSessionId === session.session_id
                      ? "bg-primary text-white"
                      : "bg-gray-50 hover:bg-gray-100 text-gray-700"
                  }`}
                >
                  <button
                    onClick={() => {
                      onSelectSession(session.session_id);
                      onClose();
                    }}
                    className="flex-1 text-left px-4 py-3"
                  >
                    <div className="flex items-center gap-3">
                      <svg
                        className="w-5 h-5 flex-shrink-0"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                        />
                      </svg>
                      <span className="text-sm font-medium truncate">
                        {formatSessionId(session.session_id)}
                      </span>
                    </div>
                  </button>
                  <button
                    onClick={(e) => deleteSession(session.session_id, e)}
                    disabled={deletingId === session.session_id}
                    className={`p-2 mr-2 rounded-lg transition-colors ${
                      currentSessionId === session.session_id
                        ? "text-white/70 hover:text-white hover:bg-white/20"
                        : "text-gray-400 hover:text-red-500 hover:bg-red-50"
                    } ${deletingId === session.session_id ? "opacity-50" : ""}`}
                    aria-label="Delete session"
                  >
                    {deletingId === session.session_id ? (
                      <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                    )}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Refresh Button */}
        <div className="p-4 border-t border-gray-200">
          <button
            onClick={fetchSessions}
            disabled={isLoading}
            className="w-full px-4 py-2 text-sm font-medium text-primary border border-primary rounded-lg hover:bg-primary hover:text-white transition-colors disabled:opacity-50"
          >
            Refresh Sessions
          </button>
        </div>
      </div>
    </>
  );
}
