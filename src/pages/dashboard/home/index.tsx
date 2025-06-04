import React, { useState, useEffect } from 'react';
import { 
  FolderKanban, 
  Plus,
  X,
  Calendar as CalendarIcon,
  StickyNote,
  Edit,
  Trash2,
  Clock,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import Calendar from 'react-calendar';
import { format } from 'date-fns';
import { supabase } from '../../../services/supabase';
import Button from '../../../components/common/Button';
import { useAuth } from '../../../context/AuthContext';
import 'react-calendar/dist/Calendar.css';

type ProjectDate = {
  id: string;
  name: string;
  date: Date;
  type: 'start' | 'end';
};

type Note = {
  id: string;
  content: string;
  created_at: string;
};

type Project = {
  id: string;
  name: string;
  start_date: string | null;
  end_date: string | null;
  status: string;
  progress: number;
};

const DashboardHome = () => {
  const { user } = useAuth();
  const [activeProjects, setActiveProjects] = useState<Project[]>([]);
  const [projectDates, setProjectDates] = useState<ProjectDate[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [newNote, setNewNote] = useState('');
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentDate] = useState(new Date());
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      // Fetch projects where user is owner
      const { data: ownedProjects, error: ownedProjectsError } = await supabase
        .from('projects')
        .select('id, name, start_date, end_date, status, progress')
        .eq('owner_id', user?.id)
        .eq('status', 'in_progress');

      if (ownedProjectsError) throw ownedProjectsError;

      // Fetch projects where user is a member
      const { data: memberProjects, error: memberProjectsError } = await supabase
        .from('project_members')
        .select('project:projects(id, name, start_date, end_date, status, progress)')
        .eq('user_id', user?.id)
        .eq('projects.status', 'in_progress');

      if (memberProjectsError) throw memberProjectsError;

      // Combine and deduplicate projects
      const memberProjectsData = memberProjects
        ?.map(mp => mp.project as Project)
        .filter(Boolean) || [];

      const allProjects = [
        ...(ownedProjects || []),
        ...memberProjectsData
      ];

      // Remove duplicates based on project id
      const uniqueProjects = Array.from(
        new Map(allProjects.map(project => [project.id, project])).values()
      );

      setActiveProjects(uniqueProjects);

      // Create project dates array for calendar
      const dates: ProjectDate[] = [];
      uniqueProjects.forEach(project => {
        if (project.start_date) {
          dates.push({
            id: project.id,
            name: project.name,
            date: new Date(project.start_date),
            type: 'start'
          });
        }
        if (project.end_date) {
          dates.push({
            id: project.id,
            name: project.name,
            date: new Date(project.end_date),
            type: 'end'
          });
        }
      });
      setProjectDates(dates);

      // Fetch notes
      const { data: userNotes, error: notesError } = await supabase
        .from('user_notes')
        .select('*')
        .order('created_at', { ascending: false });

      if (notesError) throw notesError;
      setNotes(userNotes || []);

    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddNote = async () => {
    if (!newNote.trim()) return;

    try {
      const { data, error } = await supabase
        .from('user_notes')
        .insert([{ content: newNote.trim() }])
        .select()
        .single();

      if (error) throw error;

      setNotes([data, ...notes]);
      setNewNote('');
    } catch (err) {
      console.error('Error adding note:', err);
    }
  };

  const handleUpdateNote = async (note: Note) => {
    try {
      const { error } = await supabase
        .from('user_notes')
        .update({ content: note.content })
        .eq('id', note.id);

      if (error) throw error;

      setNotes(notes.map(n => n.id === note.id ? note : n));
      setEditingNote(null);
    } catch (err) {
      console.error('Error updating note:', err);
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    try {
      const { error } = await supabase
        .from('user_notes')
        .delete()
        .eq('id', noteId);

      if (error) throw error;

      setNotes(notes.filter(note => note.id !== noteId));
    } catch (err) {
      console.error('Error deleting note:', err);
    }
  };

  const getProjectStatusIcon = (status: string) => {
    switch (status) {
      case 'in_progress':
        return <Clock className="w-5 h-5 text-blue-500" />;
      case 'finished':
        return <CheckCircle2 className="w-5 h-5 text-green-500" />;
      default:
        return <AlertCircle className="w-5 h-5 text-yellow-500" />;
    }
  };

  const tileContent = ({ date, view }: { date: Date; view: string }) => {
    if (view !== 'month') return null;

    const dateEvents = projectDates.filter(
      projectDate => 
        projectDate.date.getDate() === date.getDate() &&
        projectDate.date.getMonth() === date.getMonth() &&
        projectDate.date.getFullYear() === date.getFullYear()
    );

    if (dateEvents.length === 0) return null;

    return (
      <div className="absolute bottom-0 left-0 right-0 text-xs">
        <div className="flex justify-center space-x-1">
          {dateEvents.map((event, index) => (
            <div
              key={`${event.id}-${event.type}-${index}`}
              className={`h-2 w-2 rounded-full ${
                event.type === 'start' ? 'bg-green-500' : 'bg-red-500'
              }`}
              title={`${event.name} - ${event.type === 'start' ? 'Inicio' : 'Fin'}`}
            />
          ))}
        </div>
      </div>
    );
  };

  const tileClassName = ({ date, view }: { date: Date; view: string }) => {
    if (view !== 'month') return '';

    const isToday = 
      date.getDate() === currentDate.getDate() &&
      date.getMonth() === currentDate.getMonth() &&
      date.getFullYear() === currentDate.getFullYear();

    return isToday ? 'bg-gray-100 font-bold' : '';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-black"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-semibold text-gray-900 mb-6">Dashboard</h1>
      
      {/* Active Projects */}
      <div className="mb-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <FolderKanban className="h-6 w-6 text-gray-400 mr-2" />
              <h2 className="text-lg font-medium">Proyectos Activos ({activeProjects.length})</h2>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {activeProjects.map(project => (
              <div
                key={project.id}
                className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium truncate">{project.name}</h3>
                  {getProjectStatusIcon(project.status)}
                </div>
                <div className="space-y-2">
                  <div className="flex items-center text-sm text-gray-500">
                    <CalendarIcon className="w-4 h-4 mr-1" />
                    <span>{format(new Date(project.start_date!), 'dd/MM/yyyy')}</span>
                  </div>
                  <div className="flex items-center">
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-black rounded-full h-2"
                        style={{ width: `${project.progress}%` }}
                      />
                    </div>
                    <span className="ml-2 text-sm font-medium">{project.progress}%</span>
                  </div>
                </div>
              </div>
            ))}

            {activeProjects.length === 0 && (
              <div className="col-span-full text-center py-8 text-gray-500">
                No hay proyectos activos
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Image Carousel */}
      <div className="mb-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-medium">Galería de Proyectos</h2>
          </div>
          <div className="relative h-64 overflow-hidden rounded-lg">
            {[
              "https://images.pexels.com/photos/1216589/pexels-photo-1216589.jpeg",
              "https://images.pexels.com/photos/323780/pexels-photo-323780.jpeg",
              "https://images.pexels.com/photos/2219024/pexels-photo-2219024.jpeg",
              "https://images.pexels.com/photos/416405/pexels-photo-416405.jpeg"
            ].map((image, index) => (
              <img
                key={index}
                src={image}
                alt={`Project image ${index + 1}`}
                className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ${
                  index === currentSlide ? 'opacity-100' : 'opacity-0'
                }`}
              />
            ))}
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
              {[0, 1, 2, 3].map((index) => (
                <button
                  key={index}
                  onClick={() => setCurrentSlide(index)}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    index === currentSlide ? 'bg-white' : 'bg-white/50'
                  }`}
                />
              ))}
            </div>
            <button
              onClick={() => setCurrentSlide(prev => prev === 0 ? 3 : prev - 1)}
              className="absolute left-4 top-1/2 transform -translate-y-1/2 p-2 rounded-full bg-black/50 text-white hover:bg-black/75 transition-colors"
            >
              ←
            </button>
            <button
              onClick={() => setCurrentSlide(prev => prev === 3 ? 0 : prev + 1)}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 p-2 rounded-full bg-black/50 text-white hover:bg-black/75 transition-colors"
            >
              →
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Calendar */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center mb-4">
            <CalendarIcon className="w-5 h-5 text-gray-400 mr-2" />
            <h2 className="text-lg font-medium">Calendario de Proyectos</h2>
          </div>
          <div className="calendar-container">
            <Calendar
              value={currentDate}
              tileContent={tileContent}
              tileClassName={tileClassName}
              className="w-full border-0"
            />
          </div>
          <div className="mt-4 flex items-center justify-center space-x-4 text-sm">
            <div className="flex items-center">
              <span className="h-2 w-2 rounded-full bg-green-500 mr-2"></span>
              <span>Inicio de proyecto</span>
            </div>
            <div className="flex items-center">
              <span className="h-2 w-2 rounded-full bg-red-500 mr-2"></span>
              <span>Fin de proyecto</span>
            </div>
          </div>
        </div>

        {/* Notes */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center mb-4">
            <StickyNote className="w-5 h-5 text-gray-400 mr-2" />
            <h2 className="text-lg font-medium">Notas</h2>
          </div>

          <div className="space-y-4">
            {/* Add note */}
            <div className="flex gap-2">
              <input
                type="text"
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                placeholder="Agregar una nota..."
                className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-black focus:ring-black"
                onKeyPress={(e) => e.key === 'Enter' && handleAddNote()}
              />
              <Button
                variant="primary"
                onClick={handleAddNote}
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>

            {/* Notes list */}
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {notes.map(note => (
                <div
                  key={note.id}
                  className="bg-gray-50 rounded-lg p-3 relative group"
                >
                  {editingNote?.id === note.id ? (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={editingNote.content}
                        onChange={(e) => setEditingNote({
                          ...editingNote,
                          content: e.target.value
                        })}
                        className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-black focus:ring-black"
                        autoFocus
                      />
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => handleUpdateNote(editingNote)}
                      >
                        Guardar
                      </Button>
                    </div>
                  ) : (
                    <>
                      <p className="text-sm pr-16">{note.content}</p>
                      <div className="absolute top-3 right-3 flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => setEditingNote(note)}
                          className="text-gray-400 hover:text-gray-600"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteNote(note.id)}
                          className="text-gray-400 hover:text-red-600"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <p className="text-xs text-gray-400 mt-1">
                        {format(new Date(note.created_at), 'dd/MM/yyyy HH:mm')}
                      </p>
                    </>
                  )}
                </div>
              ))}

              {notes.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No hay notas
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardHome;