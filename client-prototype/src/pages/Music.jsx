import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Music as MusicIcon, Play, Clock, Search, Filter } from 'lucide-react';
import ContentCard from '../components/ContentCard';
import api from '../api';

const Music = () => {
  const { user } = useAuth();
  const [contents, setContents] = useState([]);
  const [filteredContents, setFilteredContents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const categories = ['all', 'salegy', 'hira_gasy', 'tsapiky', 'beko', 'podcast', 'autre'];

  const filterContents = useCallback(() => {
    let filtered = contents;

    if (selectedCategory !== 'all') {
      filtered = filtered.filter(c => c.category === selectedCategory);
    }

    if (searchQuery) {
      filtered = filtered.filter(c => 
        c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.artist?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredContents(filtered);
  }, [contents, selectedCategory, searchQuery]);

  useEffect(() => {
    const loadContents = async () => {
      try {
        const response = await api.get('/contents');
        const audioContents = response.data.contents?.filter(c => c.type === 'audio') || [];
        setContents(audioContents);
      } catch (err) {
        console.error('Erreur chargement musique:', err);
      } finally {
        setLoading(false);
      }
    };
    loadContents();
  }, []);

  useEffect(() => {
    filterContents();
  }, [filterContents]);

  const formatDuration = (seconds) => {
    if (!seconds) return '--:--';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <div className="loading-spinner" />
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '40px 32px 80px' }}>
      {/* ... (le JSX reste identique) ... */}
    </div>
  );
};

export default Music;
