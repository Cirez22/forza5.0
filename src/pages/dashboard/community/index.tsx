import React, { useState, useEffect, useCallback } from 'react';
import { Plus, MessageSquare, Users, Search, Clock, ArrowLeft } from 'lucide-react';
import { format } from 'date-fns';
import { supabase } from '../../../services/supabase';
import { useAuth } from '../../../context/AuthContext';
import Button from '../../../components/common/Button';
import Input from '../../../components/common/Input';
import debounce from 'lodash/debounce';

type ForumCategory = {
  id: string;
  name: string;
  description: string;
};

type ForumTopic = {
  id: string;
  title: string;
  category_id: string;
  created_by: string;
  created_at: string;
  _count?: {
    posts: number;
  };
};

type ForumPost = {
  id: string;
  topic_id: string;
  content: string;
  user_id: string;
  created_at: string;
  view_count: number;
  comment_count: number;
  profiles: {
    full_name: string;
    email?: string;
  };
};

const CommunityPage = () => {
  const { user } = useAuth();
  const [categories, setCategories] = useState<ForumCategory[]>([]);
  const [topics, setTopics] = useState<ForumTopic[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedTopic, setSelectedTopic] = useState<ForumTopic | null>(null);
  const [posts, setPosts] = useState<ForumPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showNewTopicForm, setShowNewTopicForm] = useState(false);
  const [showNewPostForm, setShowNewPostForm] = useState(false);
  const [newTopicTitle, setNewTopicTitle] = useState('');
  const [newTopicCategory, setNewTopicCategory] = useState('');
  const [newPostContent, setNewPostContent] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchCategories();
    fetchTopics();
  }, []);

  useEffect(() => {
    if (selectedTopic) {
      fetchPosts(selectedTopic.id);
    }
  }, [selectedTopic]);

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('forum_categories')
        .select('*')
        .order('name');

      if (error) throw error;
      setCategories(data || []);
    } catch (err) {
      console.error('Error fetching categories:', err);
    }
  };

  const fetchTopics = async () => {
    try {
      let query = supabase
        .from('forum_topics')
        .select(`
          *,
          posts:forum_posts(count)
        `);

      if (selectedCategory) {
        query = query.eq('category_id', selectedCategory);
      }

      if (searchQuery) {
        query = query.textSearch('search_text', searchQuery);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;
      setTopics(data || []);
    } catch (err) {
      console.error('Error fetching topics:', err);
      setError('Error al cargar los temas');
    } finally {
      setLoading(false);
    }
  };

  const debouncedSearch = useCallback(
    debounce((query: string) => {
      fetchTopics();
    }, 300),
    [selectedCategory]
  );

  useEffect(() => {
    debouncedSearch(searchQuery);
    return () => debouncedSearch.cancel();
  }, [searchQuery, debouncedSearch]);

  const fetchPosts = async (topicId: string) => {
    try {
      const { data, error } = await supabase
        .from('forum_posts')
        .select(`
          *,
          user:profiles (
            full_name,
            email
          )
        `)
        .eq('topic_id', topicId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPosts(data || []);
    } catch (err) {
      console.error('Error fetching posts:', err);
      setError('Error al cargar las publicaciones');
    }
  };

  const handleCreateTopic = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTopicTitle.trim() || !newTopicCategory) return;

    try {
      const { data, error } = await supabase
        .from('forum_topics')
        .insert([
          {
            title: newTopicTitle.trim(),
            category_id: newTopicCategory,
            created_by: user?.id,
          },
        ])
        .select()
        .single();

      if (error) throw error;

      setTopics([data, ...topics]);
      setNewTopicTitle('');
      setNewTopicCategory('');
      setShowNewTopicForm(false);
      fetchTopics();
    } catch (err) {
      console.error('Error creating topic:', err);
      setError('Error al crear el tema');
    }
  };

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPostContent.trim() || !selectedTopic) return;

    try {
      const { data, error } = await supabase
        .from('forum_posts')
        .insert([
          {
            topic_id: selectedTopic.id,
            content: newPostContent.trim(),
            user_id: user?.id,
          },
        ])
        .select()
        .single();

      if (error) throw error;

      await fetchPosts(selectedTopic.id);
      setNewPostContent('');
      setShowNewPostForm(false);
    } catch (err) {
      console.error('Error creating post:', err);
      setError('Error al crear la publicación');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Comunidad</h1>
        <Button
          variant="primary"
          onClick={() => setShowNewTopicForm(true)}
        >
          <Plus className="w-4 h-4 mr-2" />
          Nuevo Tema
        </Button>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
          {error}
        </div>
      )}

      <div className="mb-6">
        <Input
          id="search"
          name="search"
          placeholder="Buscar temas y publicaciones..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="max-w-md"
        />
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {/* Categories Bar */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex space-x-2 overflow-x-auto pb-2">
            <button
              onClick={() => {
                setSelectedCategory(null);
                setSelectedTopic(null);
                fetchTopics();
              }}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap ${
                !selectedCategory
                  ? 'bg-black text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Todas las categorías
            </button>
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => {
                  setSelectedCategory(category.id);
                  setSelectedTopic(null);
                  fetchTopics();
                }}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap ${
                  selectedCategory === category.id
                    ? 'bg-black text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {category.name}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 divide-y md:divide-y-0 md:divide-x divide-gray-200">
          {/* Topics List */}
          <div className="md:col-span-4 border-r border-gray-200">
            <div className="p-4">
              <h2 className="text-lg font-medium mb-4">Temas</h2>
              <div className="space-y-2">
                {topics.map((topic) => (
                  <button
                    key={topic.id}
                    onClick={() => setSelectedTopic(topic)}
                    className={`w-full text-left p-3 rounded-lg transition-colors ${
                      selectedTopic?.id === topic.id
                        ? 'bg-gray-100'
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    <h3 className="font-medium text-gray-900 mb-1">
                      {topic.title}
                    </h3>
                    <div className="flex items-center text-sm text-gray-500">
                      <Clock className="w-4 h-4 mr-1" />
                      <span>{format(new Date(topic.created_at), 'dd/MM/yyyy')}</span>
                      <span className="mx-2">•</span>
                      <MessageSquare className="w-4 h-4 mr-1" />
                      <span>{topic._count?.posts || 0} posts</span>
                    </div>
                  </button>
                ))}

                {topics.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    No hay temas para mostrar
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Posts List */}
          <div className="md:col-span-8">
            <div className="p-4">
              {selectedTopic ? (
                <>
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center">
                      <button
                        onClick={() => setSelectedTopic(null)}
                        className="mr-3 text-gray-400 hover:text-gray-600"
                      >
                        <ArrowLeft className="w-5 h-5" />
                      </button>
                      <h2 className="text-lg font-medium">{selectedTopic.title}</h2>
                    </div>
                    <Button
                      variant="primary"
                      onClick={() => setShowNewPostForm(true)}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Responder
                    </Button>
                  </div>

                  <div className="space-y-4">
                    {posts.map((post) => (
                      <div
                        key={post.id}
                        className="bg-gray-50 rounded-lg p-4"
                      >
                        <div className="flex items-start space-x-3">
                          <div className="flex-shrink-0">
                            <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                              <Users className="w-6 h-6 text-gray-500" />
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-900">
                              {post.profiles?.full_name || 'Usuario'}
                            </p>
                            <p className="text-sm text-gray-500 mb-2">
                              {format(new Date(post.created_at), 'dd/MM/yyyy HH:mm')}
                            </p>
                            <div className="prose prose-sm max-w-none">
                              {post.content}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}

                    {posts.length === 0 && (
                      <div className="text-center py-8 text-gray-500">
                        No hay publicaciones en este tema
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="text-center py-12">
                  <MessageSquare className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">
                    Selecciona un tema
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Elige un tema de la lista para ver las publicaciones
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* New Topic Modal */}
      {showNewTopicForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h2 className="text-lg font-medium mb-4">Nuevo Tema</h2>
            <form onSubmit={handleCreateTopic} className="space-y-4">
              <Input
                id="topicTitle"
                name="topicTitle"
                label="Título"
                value={newTopicTitle}
                onChange={(e) => setNewTopicTitle(e.target.value)}
                required
              />

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Categoría
                </label>
                <select
                  value={newTopicCategory}
                  onChange={(e) => setNewTopicCategory(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-black focus:ring-black sm:text-sm"
                  required
                >
                  <option value="">Seleccionar categoría</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end space-x-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowNewTopicForm(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit" variant="primary">
                  Crear Tema
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* New Post Modal */}
      {showNewPostForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h2 className="text-lg font-medium mb-4">Nueva Publicación</h2>
            <form onSubmit={handleCreatePost}>
              <textarea
                value={newPostContent}
                onChange={(e) => setNewPostContent(e.target.value)}
                placeholder="Escribe tu publicación..."
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-black"
                rows={4}
                required
              />
              <div className="mt-4 flex justify-end space-x-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowNewPostForm(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit" variant="primary">
                  Publicar
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CommunityPage;