import { useEffect, useState, useCallback } from 'react';
import {
  subscribeProjectChat,
  sendProjectMessage,
  subscribePrivateChats,
  subscribePrivateChatMessages,
  sendPrivateMessage,
  getOrCreatePrivateChat,
  getProjectMembers,
  addProjectMember,
  removeProjectMember,
} from '../services/chat.service';

/**
 * Hook for project chat messages (real-time)
 */
export function useProjectChat(projectId) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!projectId) {
      setMessages([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const unsub = subscribeProjectChat(projectId, (msgs) => {
      setMessages(msgs);
      setLoading(false);
    });
    return () => unsub();
  }, [projectId]);

  const send = useCallback(
    async (senderId, senderName, text, senderPhoto) => {
      if (!projectId || !text.trim()) return;
      await sendProjectMessage(projectId, senderId, senderName, text.trim(), senderPhoto);
    },
    [projectId]
  );

  return { messages, loading, send };
}

/**
 * Hook for project members
 */
export function useProjectMembers(projectId, projectData) {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!projectId) {
      setMembers([]);
      setLoading(false);
      return;
    }
    // Read members from the project data directly if available
    if (projectData && projectData.members) {
      setMembers(projectData.members);
      setLoading(false);
    } else {
      getProjectMembers(projectId).then((m) => {
        setMembers(m);
        setLoading(false);
      });
    }
  }, [projectId, projectData]);

  const addMember = useCallback(
    async (member) => {
      await addProjectMember(projectId, member);
      setMembers((prev) => [...prev, member]);
    },
    [projectId]
  );

  const removeMember = useCallback(
    async (member) => {
      await removeProjectMember(projectId, member);
      setMembers((prev) => prev.filter((m) => m.userId !== member.userId));
    },
    [projectId]
  );

  return { members, loading, addMember, removeMember };
}

/**
 * Hook for private chats list (admin sees all)
 */
export function usePrivateChats(userId = null) {
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const unsub = subscribePrivateChats((c) => {
      setChats(c);
      setLoading(false);
    }, userId);
    return () => unsub();
  }, [userId]);

  return { chats, loading };
}

/**
 * Hook for a single private chat messages
 */
export function usePrivateChatMessages(chatId) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!chatId) {
      setMessages([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const unsub = subscribePrivateChatMessages(chatId, (msgs) => {
      setMessages(msgs);
      setLoading(false);
    });
    return () => unsub();
  }, [chatId]);

  const send = useCallback(
    async (senderId, senderName, text, senderPhoto) => {
      if (!chatId || !text.trim()) return;
      await sendPrivateMessage(chatId, senderId, senderName, text.trim(), senderPhoto);
    },
    [chatId]
  );

  return { messages, loading, send };
}
