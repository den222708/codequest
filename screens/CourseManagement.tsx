import React, { useState } from 'react';
import { Course, Semester, Lab, StudentGroup, User } from '../types';
import { useApp } from '../store/AppContext';

const CourseManagement: React.FC = () => {
    const { users } = useApp();

    // Local state for courses (will be moved to context later)
    const [courses, setCourses] = useState<Course[]>([]);

    const [semesters, setSemesters] = useState<Semester[]>([]);

    const [labs, setLabs] = useState<Lab[]>([]);

    const [studentGroups, setStudentGroups] = useState<StudentGroup[]>([]);

    const [expandedCourses, setExpandedCourses] = useState<string[]>(['course-1']);
    const [expandedSemesters, setExpandedSemesters] = useState<string[]>(['sem-1']);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterDepartment, setFilterDepartment] = useState('all');
    const [filterStatus, setFilterStatus] = useState('all');

    // Modal states
    const [showCourseModal, setShowCourseModal] = useState(false);
    const [showSemesterModal, setShowSemesterModal] = useState(false);
    const [showLabModal, setShowLabModal] = useState(false);
    const [showStudentModal, setShowStudentModal] = useState(false);
    const [editingCourse, setEditingCourse] = useState<Course | null>(null);
    const [editingSemester, setEditingSemester] = useState<Semester | null>(null);
    const [editingLab, setEditingLab] = useState<Lab | null>(null);
    const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
    const [selectedSemesterId, setSelectedSemesterId] = useState<string | null>(null);
    const [selectedLabId, setSelectedLabId] = useState<string | null>(null);

    // Form states
    const [courseForm, setCourseForm] = useState({ code: '', name: '', description: '', department: '', credits: 3 });
    const [semesterForm, setSemesterForm] = useState({ name: '', year: 2026, term: 'fall' as const, startDate: '', endDate: '' });
    const [labForm, setLabForm] = useState({ name: '', schedule: '', location: '', capacity: 30 });

    const students = users?.filter(u => u.role === 'student') || [];
    const professors = users?.filter(u => u.role === 'professor') || [];

    const departments = [...new Set(courses.map(c => c.department))];

    const filteredCourses = courses.filter(course => {
        const matchesSearch = course.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            course.code.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesDept = filterDepartment === 'all' || course.department === filterDepartment;
        const matchesStatus = filterStatus === 'all' || course.status === filterStatus;
        return matchesSearch && matchesDept && matchesStatus;
    });

    const toggleCourse = (courseId: string) => {
        setExpandedCourses(prev =>
            prev.includes(courseId) ? prev.filter(id => id !== courseId) : [...prev, courseId]
        );
    };

    const toggleSemester = (semesterId: string) => {
        setExpandedSemesters(prev =>
            prev.includes(semesterId) ? prev.filter(id => id !== semesterId) : [...prev, semesterId]
        );
    };

    const getSemestersForCourse = (courseId: string) => semesters.filter(s => s.courseId === courseId);
    const getLabsForSemester = (semesterId: string) => labs.filter(l => l.semesterId === semesterId);
    const getStudentsForLab = (labId: string) => {
        const group = studentGroups.find(g => g.labId === labId);
        if (!group) return [];
        return students.filter(s => group.studentIds.includes(s.id));
    };

    const handleSaveCourse = () => {
        if (editingCourse) {
            setCourses(prev => prev.map(c => c.id === editingCourse.id ? { ...c, ...courseForm, updatedAt: new Date().toISOString() } : c));
        } else {
            const newCourse: Course = {
                id: `course-${Date.now()}`,
                ...courseForm,
                status: 'active',
                createdBy: 'admin',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            };
            setCourses(prev => [...prev, newCourse]);
        }
        setShowCourseModal(false);
        setCourseForm({ code: '', name: '', description: '', department: '', credits: 3 });
        setEditingCourse(null);
    };

    const handleSaveSemester = () => {
        if (!selectedCourseId) return;
        if (editingSemester) {
            setSemesters(prev => prev.map(s => s.id === editingSemester.id ? { ...s, ...semesterForm } : s));
        } else {
            const newSemester: Semester = {
                id: `sem-${Date.now()}`,
                courseId: selectedCourseId,
                ...semesterForm,
                status: 'upcoming',
            };
            setSemesters(prev => [...prev, newSemester]);
        }
        setShowSemesterModal(false);
        setSemesterForm({ name: '', year: 2026, term: 'fall', startDate: '', endDate: '' });
        setEditingSemester(null);
    };

    const handleSaveLab = () => {
        if (!selectedSemesterId) return;
        if (editingLab) {
            setLabs(prev => prev.map(l => l.id === editingLab.id ? { ...l, ...labForm } : l));
        } else {
            const newLab: Lab = {
                id: `lab-${Date.now()}`,
                semesterId: selectedSemesterId,
                ...labForm,
                status: 'active',
            };
            setLabs(prev => [...prev, newLab]);
        }
        setShowLabModal(false);
        setLabForm({ name: '', schedule: '', location: '', capacity: 30 });
        setEditingLab(null);
    };

    const handleDeleteCourse = (courseId: string) => {
        if (confirm('Delete this course and all its semesters/labs?')) {
            const semIds = semesters.filter(s => s.courseId === courseId).map(s => s.id);
            setLabs(prev => prev.filter(l => !semIds.includes(l.semesterId)));
            setSemesters(prev => prev.filter(s => s.courseId !== courseId));
            setCourses(prev => prev.filter(c => c.id !== courseId));
        }
    };

    const handleDeleteSemester = (semesterId: string) => {
        if (confirm('Delete this semester and all its labs?')) {
            setLabs(prev => prev.filter(l => l.semesterId !== semesterId));
            setSemesters(prev => prev.filter(s => s.id !== semesterId));
        }
    };

    const handleDeleteLab = (labId: string) => {
        if (confirm('Delete this lab section?')) {
            setStudentGroups(prev => prev.filter(g => g.labId !== labId));
            setLabs(prev => prev.filter(l => l.id !== labId));
        }
    };

    const getStatusBadge = (status: string) => {
        const styles: Record<string, string> = {
            active: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
            archived: 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400',
            upcoming: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
            completed: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
            inactive: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
        };
        return <span className={`px-2 py-0.5 rounded-full text-xs font-bold capitalize ${styles[status] || styles.active}`}>{status}</span>;
    };

    return (
        <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold">Course Management</h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-1">Manage courses, semesters, labs, and student groups</p>
                </div>
                <button
                    onClick={() => { setCourseForm({ code: '', name: '', description: '', department: '', credits: 3 }); setEditingCourse(null); setShowCourseModal(true); }}
                    className="px-5 py-2.5 bg-primary hover:bg-primary-dark text-white rounded-lg font-bold flex items-center gap-2 shadow-lg shadow-primary/20"
                >
                    <span className="material-symbols-outlined">add</span>
                    Create Course
                </button>
            </div>

            {/* Filters */}
            <div className="bg-white dark:bg-background-card rounded-xl border border-slate-200 dark:border-slate-800 p-4">
                <div className="flex flex-col lg:flex-row gap-4">
                    <div className="flex-1 relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                            <span className="material-symbols-outlined">search</span>
                        </span>
                        <input
                            type="text"
                            placeholder="Search courses..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800"
                        />
                    </div>
                    <select
                        value={filterDepartment}
                        onChange={(e) => setFilterDepartment(e.target.value)}
                        className="px-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800"
                    >
                        <option value="all">All Departments</option>
                        {departments.map(dept => (
                            <option key={dept} value={dept}>{dept}</option>
                        ))}
                    </select>
                    <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        className="px-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800"
                    >
                        <option value="all">All Status</option>
                        <option value="active">Active</option>
                        <option value="archived">Archived</option>
                    </select>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {[
                    { label: 'Total Courses', value: courses.length, icon: 'school', color: 'bg-primary/10 text-primary' },
                    { label: 'Active Semesters', value: semesters.filter(s => s.status === 'active').length, icon: 'calendar_month', color: 'bg-green-500/10 text-green-500' },
                    { label: 'Lab Sections', value: labs.length, icon: 'science', color: 'bg-blue-500/10 text-blue-500' },
                    { label: 'Enrolled Students', value: studentGroups.reduce((acc, g) => acc + g.studentIds.length, 0), icon: 'groups', color: 'bg-purple-500/10 text-purple-500' },
                ].map(stat => (
                    <div key={stat.label} className="bg-white dark:bg-background-card rounded-xl border border-slate-200 dark:border-slate-800 p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-slate-500">{stat.label}</p>
                                <p className="text-2xl font-bold mt-1">{stat.value}</p>
                            </div>
                            <div className={`p-3 rounded-xl ${stat.color}`}>
                                <span className="material-symbols-outlined text-2xl">{stat.icon}</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Course List - Tree View */}
            <div className="space-y-3">
                {filteredCourses.length === 0 ? (
                    <div className="bg-white dark:bg-background-card rounded-xl border border-slate-200 dark:border-slate-800 p-12 text-center">
                        <span className="material-symbols-outlined text-5xl text-slate-300 mb-4">school</span>
                        <h3 className="text-xl font-bold mb-2">No courses found</h3>
                        <p className="text-slate-500">Create your first course to get started</p>
                    </div>
                ) : (
                    filteredCourses.map(course => (
                        <div key={course.id} className="bg-white dark:bg-background-card rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                            {/* Course Header */}
                            <div
                                className="flex items-center justify-between p-4 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50"
                                onClick={() => toggleCourse(course.id)}
                            >
                                <div className="flex items-center gap-3">
                                    <span className="material-symbols-outlined text-slate-400 transition-transform" style={{ transform: expandedCourses.includes(course.id) ? 'rotate(90deg)' : 'rotate(0deg)' }}>
                                        chevron_right
                                    </span>
                                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                                        <span className="material-symbols-outlined text-primary">school</span>
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <span className="font-bold text-lg">{course.code}</span>
                                            <span className="text-slate-400">-</span>
                                            <span className="font-medium">{course.name}</span>
                                            {getStatusBadge(course.status)}
                                        </div>
                                        <p className="text-sm text-slate-500">{course.department} • {course.credits} credits • {getSemestersForCourse(course.id).length} semesters</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                                    <button
                                        onClick={() => { setSelectedCourseId(course.id); setSemesterForm({ name: '', year: 2026, term: 'fall', startDate: '', endDate: '' }); setShowSemesterModal(true); }}
                                        className="p-2 hover:bg-primary/10 rounded-lg text-primary"
                                        title="Add Semester"
                                    >
                                        <span className="material-symbols-outlined">add_circle</span>
                                    </button>
                                    <button
                                        onClick={() => { setEditingCourse(course); setCourseForm({ code: course.code, name: course.name, description: course.description, department: course.department, credits: course.credits }); setShowCourseModal(true); }}
                                        className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg"
                                        title="Edit"
                                    >
                                        <span className="material-symbols-outlined">edit</span>
                                    </button>
                                    <button
                                        onClick={() => handleDeleteCourse(course.id)}
                                        className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg text-red-500"
                                        title="Delete"
                                    >
                                        <span className="material-symbols-outlined">delete</span>
                                    </button>
                                </div>
                            </div>

                            {/* Semesters */}
                            {expandedCourses.includes(course.id) && (
                                <div className="border-t border-slate-200 dark:border-slate-700">
                                    {getSemestersForCourse(course.id).map(semester => (
                                        <div key={semester.id} className="ml-8 border-l-2 border-slate-200 dark:border-slate-700">
                                            {/* Semester Header */}
                                            <div
                                                className="flex items-center justify-between p-3 pl-6 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50"
                                                onClick={() => toggleSemester(semester.id)}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <span className="material-symbols-outlined text-slate-400 transition-transform text-sm" style={{ transform: expandedSemesters.includes(semester.id) ? 'rotate(90deg)' : 'rotate(0deg)' }}>
                                                        chevron_right
                                                    </span>
                                                    <span className="material-symbols-outlined text-blue-500">calendar_month</span>
                                                    <div>
                                                        <span className="font-medium">{semester.name}</span>
                                                        {getStatusBadge(semester.status)}
                                                    </div>
                                                    <span className="text-sm text-slate-400">{getLabsForSemester(semester.id).length} labs</span>
                                                </div>
                                                <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                                                    <button
                                                        onClick={() => { setSelectedSemesterId(semester.id); setLabForm({ name: '', schedule: '', location: '', capacity: 30 }); setShowLabModal(true); }}
                                                        className="p-1.5 hover:bg-primary/10 rounded text-primary text-sm"
                                                        title="Add Lab"
                                                    >
                                                        <span className="material-symbols-outlined text-lg">add</span>
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteSemester(semester.id)}
                                                        className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded text-red-500 text-sm"
                                                        title="Delete"
                                                    >
                                                        <span className="material-symbols-outlined text-lg">delete</span>
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Labs */}
                                            {expandedSemesters.includes(semester.id) && (
                                                <div className="ml-8 border-l-2 border-slate-200 dark:border-slate-700">
                                                    {getLabsForSemester(semester.id).map(lab => (
                                                        <div key={lab.id} className="flex items-center justify-between p-3 pl-6 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                                            <div className="flex items-center gap-3">
                                                                <span className="material-symbols-outlined text-green-500">science</span>
                                                                <div>
                                                                    <div className="flex items-center gap-2">
                                                                        <span className="font-medium">{lab.name}</span>
                                                                        <span className="text-xs text-slate-400 bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded">{lab.schedule}</span>
                                                                    </div>
                                                                    <p className="text-sm text-slate-500">{lab.location} • Capacity: {lab.capacity} • {getStudentsForLab(lab.id).length} enrolled</p>
                                                                </div>
                                                            </div>
                                                            <div className="flex items-center gap-1">
                                                                <button
                                                                    onClick={() => { setSelectedLabId(lab.id); setShowStudentModal(true); }}
                                                                    className="px-3 py-1.5 bg-primary/10 text-primary rounded-lg text-sm font-medium hover:bg-primary/20"
                                                                >
                                                                    Manage Students
                                                                </button>
                                                                <button
                                                                    onClick={() => handleDeleteLab(lab.id)}
                                                                    className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded text-red-500"
                                                                >
                                                                    <span className="material-symbols-outlined text-lg">delete</span>
                                                                </button>
                                                            </div>
                                                        </div>
                                                    ))}
                                                    {getLabsForSemester(semester.id).length === 0 && (
                                                        <p className="p-3 pl-6 text-sm text-slate-400 italic">No lab sections yet</p>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                    {getSemestersForCourse(course.id).length === 0 && (
                                        <p className="p-4 ml-8 text-sm text-slate-400 italic">No semesters yet. Click + to add one.</p>
                                    )}
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>

            {/* Course Modal */}
            {showCourseModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-2xl font-bold">{editingCourse ? 'Edit Course' : 'Create Course'}</h3>
                            <button onClick={() => setShowCourseModal(false)} className="text-slate-400 hover:text-slate-600">
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold mb-2">Course Code *</label>
                                    <input
                                        type="text"
                                        value={courseForm.code}
                                        onChange={(e) => setCourseForm(prev => ({ ...prev, code: e.target.value }))}
                                        className="w-full px-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-600 dark:bg-slate-700"
                                        placeholder="CS201"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold mb-2">Credits</label>
                                    <input
                                        type="number"
                                        value={courseForm.credits}
                                        onChange={(e) => setCourseForm(prev => ({ ...prev, credits: parseInt(e.target.value) }))}
                                        className="w-full px-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-600 dark:bg-slate-700"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold mb-2">Course Name *</label>
                                <input
                                    type="text"
                                    value={courseForm.name}
                                    onChange={(e) => setCourseForm(prev => ({ ...prev, name: e.target.value }))}
                                    className="w-full px-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-600 dark:bg-slate-700"
                                    placeholder="Data Structures"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold mb-2">Department *</label>
                                <input
                                    type="text"
                                    value={courseForm.department}
                                    onChange={(e) => setCourseForm(prev => ({ ...prev, department: e.target.value }))}
                                    className="w-full px-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-600 dark:bg-slate-700"
                                    placeholder="Computer Science"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold mb-2">Description</label>
                                <textarea
                                    value={courseForm.description}
                                    onChange={(e) => setCourseForm(prev => ({ ...prev, description: e.target.value }))}
                                    className="w-full px-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-600 dark:bg-slate-700"
                                    rows={3}
                                    placeholder="Course description..."
                                />
                            </div>
                            <div className="flex gap-3 pt-4">
                                <button
                                    onClick={() => setShowCourseModal(false)}
                                    className="flex-1 px-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg font-medium"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSaveCourse}
                                    disabled={!courseForm.code || !courseForm.name || !courseForm.department}
                                    className="flex-1 px-4 py-2.5 bg-primary text-white rounded-lg font-bold disabled:opacity-50"
                                >
                                    {editingCourse ? 'Save Changes' : 'Create Course'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Semester Modal */}
            {showSemesterModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-2xl font-bold">Add Semester</h3>
                            <button onClick={() => setShowSemesterModal(false)} className="text-slate-400 hover:text-slate-600">
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold mb-2">Year</label>
                                    <input
                                        type="number"
                                        value={semesterForm.year}
                                        onChange={(e) => setSemesterForm(prev => ({ ...prev, year: parseInt(e.target.value) }))}
                                        className="w-full px-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-600 dark:bg-slate-700"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold mb-2">Term</label>
                                    <select
                                        value={semesterForm.term}
                                        onChange={(e) => {
                                            const term = e.target.value as 'spring' | 'summer' | 'fall' | 'winter';
                                            setSemesterForm(prev => ({ ...prev, term, name: `${term.charAt(0).toUpperCase() + term.slice(1)} ${prev.year}` }));
                                        }}
                                        className="w-full px-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-600 dark:bg-slate-700"
                                    >
                                        <option value="spring">Spring</option>
                                        <option value="summer">Summer</option>
                                        <option value="fall">Fall</option>
                                        <option value="winter">Winter</option>
                                    </select>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold mb-2">Start Date</label>
                                    <input
                                        type="date"
                                        value={semesterForm.startDate}
                                        onChange={(e) => setSemesterForm(prev => ({ ...prev, startDate: e.target.value }))}
                                        className="w-full px-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-600 dark:bg-slate-700"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold mb-2">End Date</label>
                                    <input
                                        type="date"
                                        value={semesterForm.endDate}
                                        onChange={(e) => setSemesterForm(prev => ({ ...prev, endDate: e.target.value }))}
                                        className="w-full px-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-600 dark:bg-slate-700"
                                    />
                                </div>
                            </div>
                            <div className="flex gap-3 pt-4">
                                <button onClick={() => setShowSemesterModal(false)} className="flex-1 px-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg font-medium">Cancel</button>
                                <button onClick={handleSaveSemester} className="flex-1 px-4 py-2.5 bg-primary text-white rounded-lg font-bold">Add Semester</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Lab Modal */}
            {showLabModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-2xl font-bold">Add Lab Section</h3>
                            <button onClick={() => setShowLabModal(false)} className="text-slate-400 hover:text-slate-600">
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-semibold mb-2">Lab Name *</label>
                                <input
                                    type="text"
                                    value={labForm.name}
                                    onChange={(e) => setLabForm(prev => ({ ...prev, name: e.target.value }))}
                                    className="w-full px-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-600 dark:bg-slate-700"
                                    placeholder="Lab Section A"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold mb-2">Schedule *</label>
                                <input
                                    type="text"
                                    value={labForm.schedule}
                                    onChange={(e) => setLabForm(prev => ({ ...prev, schedule: e.target.value }))}
                                    className="w-full px-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-600 dark:bg-slate-700"
                                    placeholder="Mon/Wed 10:00 AM - 11:30 AM"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold mb-2">Location</label>
                                    <input
                                        type="text"
                                        value={labForm.location}
                                        onChange={(e) => setLabForm(prev => ({ ...prev, location: e.target.value }))}
                                        className="w-full px-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-600 dark:bg-slate-700"
                                        placeholder="Room 301"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold mb-2">Capacity</label>
                                    <input
                                        type="number"
                                        value={labForm.capacity}
                                        onChange={(e) => setLabForm(prev => ({ ...prev, capacity: parseInt(e.target.value) }))}
                                        className="w-full px-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-600 dark:bg-slate-700"
                                    />
                                </div>
                            </div>
                            <div className="flex gap-3 pt-4">
                                <button onClick={() => setShowLabModal(false)} className="flex-1 px-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg font-medium">Cancel</button>
                                <button
                                    onClick={handleSaveLab}
                                    disabled={!labForm.name || !labForm.schedule}
                                    className="flex-1 px-4 py-2.5 bg-primary text-white rounded-lg font-bold disabled:opacity-50"
                                >
                                    Add Lab
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Student Management Modal */}
            {showStudentModal && selectedLabId && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl max-h-[80vh] overflow-hidden flex flex-col">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-2xl font-bold">Manage Students</h3>
                            <button onClick={() => { setShowStudentModal(false); setSelectedLabId(null); }} className="text-slate-400 hover:text-slate-600">
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto">
                            <p className="text-sm text-slate-500 mb-4">Select students to enroll in this lab section:</p>
                            <div className="space-y-2">
                                {students.map(student => {
                                    const group = studentGroups.find(g => g.labId === selectedLabId);
                                    const isEnrolled = group?.studentIds.includes(student.id) || false;

                                    return (
                                        <label
                                            key={student.id}
                                            className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${isEnrolled
                                                    ? 'bg-primary/10 border-primary'
                                                    : 'bg-slate-50 dark:bg-slate-700 border-slate-200 dark:border-slate-600 hover:border-primary/50'
                                                }`}
                                        >
                                            <input
                                                type="checkbox"
                                                checked={isEnrolled}
                                                onChange={() => {
                                                    setStudentGroups(prev => {
                                                        const existingGroup = prev.find(g => g.labId === selectedLabId);
                                                        if (existingGroup) {
                                                            return prev.map(g =>
                                                                g.labId === selectedLabId
                                                                    ? { ...g, studentIds: isEnrolled ? g.studentIds.filter(id => id !== student.id) : [...g.studentIds, student.id] }
                                                                    : g
                                                            );
                                                        } else {
                                                            return [...prev, { id: `group-${Date.now()}`, labId: selectedLabId, name: 'Default Group', studentIds: [student.id], createdAt: new Date().toISOString() }];
                                                        }
                                                    });
                                                }}
                                                className="w-4 h-4 rounded border-slate-300"
                                            />
                                            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-sm font-bold text-primary">
                                                {student.name.charAt(0)}
                                            </div>
                                            <div>
                                                <p className="font-medium">{student.name}</p>
                                                <p className="text-sm text-slate-500">{student.email}</p>
                                            </div>
                                        </label>
                                    );
                                })}
                                {students.length === 0 && (
                                    <p className="text-center text-slate-400 py-8">No students available</p>
                                )}
                            </div>
                        </div>
                        <div className="pt-4 border-t border-slate-200 dark:border-slate-700 mt-4">
                            <button
                                onClick={() => { setShowStudentModal(false); setSelectedLabId(null); }}
                                className="w-full px-4 py-2.5 bg-primary text-white rounded-lg font-bold"
                            >
                                Done
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CourseManagement;
