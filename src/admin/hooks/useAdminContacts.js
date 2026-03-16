import { useEffect, useState, useCallback } from 'react';
import {
  getAllContacts,
  getAllTags,
  createContact,
  updateContact,
  deleteContact,
  createTag,
  deleteTag,
} from '../services/contacts.service';

/**
 * Hook to manage contacts and tags for the admin panel.
 */
export default function useAdminContacts() {
  const [contacts, setContacts] = useState([]);
  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAll = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [contactsRes, tagsRes] = await Promise.all([
        getAllContacts(),
        getAllTags(),
      ]);

      if (contactsRes.success) setContacts(contactsRes.data);
      else setError(contactsRes.error);

      if (tagsRes.success) setTags(tagsRes.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const addContact = async (data) => {
    const result = await createContact(data);
    if (result.success) await fetchAll();
    return result;
  };

  const editContact = async (contactId, data) => {
    const result = await updateContact(contactId, data);
    if (result.success) await fetchAll();
    return result;
  };

  const removeContact = async (contactId) => {
    const result = await deleteContact(contactId);
    if (result.success) await fetchAll();
    return result;
  };

  const addTag = async (name, color) => {
    const result = await createTag(name, color);
    if (result.success) await fetchAll();
    return result;
  };

  const removeTag = async (tagId) => {
    const result = await deleteTag(tagId);
    if (result.success) await fetchAll();
    return result;
  };

  return {
    contacts,
    tags,
    loading,
    error,
    refetch: fetchAll,
    addContact,
    editContact,
    removeContact,
    addTag,
    removeTag,
  };
}
