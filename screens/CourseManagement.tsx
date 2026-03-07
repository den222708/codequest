import React, { useState, useEffect } from 'react';
import { ClassInfo, ClassStudent, User } from '../types';
import { useApp } from '../store/AppContext';
import { classService } from '../services/classService';

const CourseManagement: React.FC = () => {
    const { users, classes, loadClasses, loadUsers } = useApp();

    const [searchQuery, setSearchQuery] = useState('');
    const [filterDepartment, setFilterDepartment] = useState('all');
    const [filterStatus, setFilterStatus] = useState('all');

    // Modal states
    const [showClassModal, setShowClassModal] = useState(false);
    const [showEnrollModal, setShowEnrollModal] = useState(false);
    const [editingClass, setEditingClass] = useState<ClassInfo | null>(null);
    const [enrollClassId, setEnrollClassId] = useState<string | null>(null);
    const [enrolledStudents, setEnrolledStudents] = useState<ClassStudent[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');

    // Form state
    const [classForm, setClassForm] = useState({
        name: '', code: '', description: '', department: '', teacherId: '',
    });

    useEffect(() => {
        loadClasses();
        loadUsers();
    }, []);

    const students = users?.filter(u => u.role === 'student') || [];
    const teachers = users?.filter(u => u.role === 'professor') || [];
    const departments = [...new Set(classes.map(c => c.department).filter(Boolean))];

    const filteredClasses = classes.filter(cls => {
        const matchesSearch = cls.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            cls.code.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesDept = filterDepartment === 'all' || cls.department === filterDepartment;
        const matchesStatus = filterStatus === 'all' || cls.status === filterStatus;
        return matchesSearch && matchesDept && matchesStatus;
    });

    const handleSaveClass = async () => {
        if (!classForm.name || !classForm.code || !classForm.teacherId) return;
        setIsSubmitting(true);
        setErrorMsg('');
        try {
            if (editingClass) {
                await classService.update(editingClass.id, classForm);
            } else {
                await classService.create(classForm);
            }
            await loadClasses();
            setShowClassModal(false);
            setClassForm({ name: '', code: '', description: '', department: '', teacherId: '' });
            setEditingClass(null);
        } catch (err: any) {
            setErrorMsg(err?.message || 'Failed to save class');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteClass = async (id: string) => {
        if (!confirm('Delete this class? Students will be unenrolled.')) return;
        try {
            await classService.remove(id);
            await loadClasses();
        } catch (err: any) {
            alert(err?.message || 'Failed to delete class');
        }
    };

    const openEnrollModal = async (classId: string) => {
        setEnrollClassId(classId);
        setShowEnrollModal(true);
        try {
            const enrolled = await classService.getStudents(classId);
            setEnrolledStudents(enrolled);
        } catch {
            setEnrolledStudents([]);
        }
    };

    const toggleEnroll = async (studentId: string) => {
        if (!enrollClassId) return;
        const isEnrolled = enrolledStudents.some(s => s.id === studentId);
        try {
            if (isEnrolled) {
                await classService.unenrollStudent(enrollClassId, studentId);
                setEnrolledStudents(prev => prev.filter(s => s.id !== studentId));
            } else {
                await classService.enrollStudents(enrollClassId, [studentId]);
                const student = students.find(s => s.id === studentId);
                if (student) {
                    setEnrolledStudents(prev => [...prev, {
                        enrollmentRecordId: '', enrolledAt: new Date().toISOString(),
                        id: student.id, name: student.name, email: student.email,
                        enrollmentId: student.enrollmentId || '', department: student.department || '',
                        avatar: student.avatar || '', status: 'active',
                    }]);
                }
            }
            loadClasses(); // refresh counts
        } catch (err: any) {
            alert(err?.message || 'Enrollment update failed');
        }
    };

    const getStatusBadge = (status: string) => {
        const styles: Record<string, string> = {
            active: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
            archived: 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400',
        };
        return <span className={`px-2 py-0.5 rounded-full text-xs font-bold capitalize ${styles[status] || styles.active}`}>{status}</span>;
    };

    return (
        <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold">Class Management</h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-1">Manage classes, assign teachers, and enroll students</p>
                </div>
                <button
                    onClick={() => { setClassForm({ name: '', code: '', description: '', department: '', teacherId: '' }); setEditingClass(null); setErrorMsg(''); setShowClassModal(true); }}
                    className="px-5 py-2.5 bg-primary hover:bg-primary-dark text-white rounded-lg font-bold flex items-center gap-2 shadow-lg shadow-primary/20"
                >
                    <span className="material-symbols-outlined">add</span>
                    Create Class
                </button>
            </div>

            {/* Filters */}
            <div className="bg-white dark:bg-background-card rounded-xl border border-slate-200 dark:border-slate-800 p-4">
                <div className="flex flex-col lg:flex-row gap-4">
                    <div className="flex-1 relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                            <span className="material-symbols-outlined">search</span>
                        </span>
                        <input type="text" placeholder="Search classes..." value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800" />
                    </div>
                    <select value={filterDepartment} onChange={(e) => setFilterDepartment(e.target.value)}
                        className="px-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800">
                        <option value="all">All Departments</option>
                        {departments.map(dept => <option key={dept} value={dept}>{dept}</option>)}
                    </select>
                    <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}
                        className="px-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800">
                        <option value="all">All Status</option>
                        <option value="active">Active</option>
                        <option value="archived">Archived</option>
                    </select>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                    { label: 'Total Classes', value: classes.length, icon: 'school', color: 'bg-primary/10 text-primary' },
                    { label: 'Active Classes', value: classes.filter(c => c.status === 'active').length, icon: 'check_circle', color: 'bg-green-500/10 text-green-500' },
                    { label: 'Total Enrolled', value: classes.reduce((acc, c) => acc + c.studentCount, 0), icon: 'groups', color: 'bg-purple-500/10 text-purple-500' },
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

            {/* Class List */}
            <div className="space-y-3">
                {filteredClasses.length === 0 ? (
                    <div className="bg-white dark:bg-background-card rounded-xl border border-slate-200 dark:border-slate-800 p-12 text-center">
                        <span className="material-symbols-outlined text-5xl text-slate-300 mb-4">school</span>
                        <h3 className="text-xl font-bold mb-2">No classes found</h3>
                        <p className="text-slate-500">Create your first class to get started</p>
                    </div>
                ) : (
                    filteredClasses.map(cls => (
                        <div key={cls.id} className="bg-white dark:bg-background-card rounded-xl border border-slate-200 dark:border-slate-800 p-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                                        <span className="material-symbols-outlined text-primary">school</span>
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <span className="font-bold text-lg">{cls.code}</span>
                                            <span className="text-slate-400">-</span>
                                            <span className="font-medium">{cls.name}</span>
                                            {getStatusBadge(cls.status)}
                                        </div>
                                        <p className="text-sm text-slate-500">
                                            {cls.department && `${cls.department} • `}
                                            Teacher: {cls.teacherName || 'Unassigned'} • {cls.studentCount} students
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button onClick={() => openEnrollModal(cls.id)}
                                        className="px-3 py-1.5 bg-primary/10 text-primary rounded-lg text-sm font-medium hover:bg-primary/20">
                                        Manage Students
                                    </button>
                                    <button onClick={() => {
                                        setEditingClass(cls);
                                        setClassForm({ name: cls.name, code: cls.code, description: cls.description, department: cls.department, teacherId: cls.teacherId });
                                        setErrorMsg('');
                                        setShowClassModal(true);
                                    }} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg" title="Edit">
                                        <span className="material-symbols-outlined">edit</span>
                                    </button>
                                    <button onClick={() => handleDeleteClass(cls.id)}
                                        className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg text-red-500" title="Delete">
                                        <span className="material-symbols-outlined">delete</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Create/Edit Class Modal */}
            {showClassModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-2xl font-bold">{editingClass ? 'Edit Class' : 'Create Class'}</h3>
                            <button onClick={() => setShowClassModal(false)} className="text-slate-400 hover:text-slate-600">
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold mb-2">Class Code *</label>
                                    <input type="text" value={classForm.code}
                                        onChange={(e) => setClassForm(prev => ({ ...prev, code: e.target.value }))}
                                        className="w-full px-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-600 dark:bg-slate-700"
                                        placeholder="CS201-A" />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold mb-2">Department</label>
                                    <input type="text" value={classForm.department}
                                        onChange={(e) => setClassForm(prev => ({ ...prev, department: e.target.value }))}
                                        className="w-full px-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-600 dark:bg-slate-700"
                                        placeholder="Computer Science" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold mb-2">Class Name *</label>
                                <input type="text" value={classForm.name}
                                    onChange={(e) => setClassForm(prev => ({ ...prev, name: e.target.value }))}
                                    className="w-full px-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-600 dark:bg-slate-700"
                                    placeholder="Data Structures Section A" />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold mb-2">Description</label>
                                <textarea value={classForm.description}
                                    onChange={(e) => setClassForm(prev => ({ ...prev, description: e.target.value }))}
                                    className="w-full px-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-600 dark:bg-slate-700"
                                    rows={2} placeholder="Class description..." />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold mb-2">Assign Teacher *</label>
                                <select value={classForm.teacherId}
                                    onChange={(e) => setClassForm(prev => ({ ...prev, teacherId: e.target.value }))}
                                    className="w-full px-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-600 dark:bg-slate-700">
                                    <option value="">Select a teacher...</option>
                                    {teachers.map(t => (
                                        <option key={t.id} value={t.id}>{t.name} ({t.email})</option>
                                    ))}
                                </select>
                            </div>
                            {errorMsg && <p className="text-red-500 text-sm">{errorMsg}</p>}
                            <div className="flex gap-3 pt-4">
                                <button onClick={() => setShowClassModal(false)}
                                    disabled={isSubmitting}
                                    className="flex-1 px-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg font-medium disabled:opacity-50">
                                    Cancel
                                </button>
                                <button onClick={handleSaveClass}
                                    disabled={!classForm.name || !classForm.code || !classForm.teacherId || isSubmitting}
                                    className="flex-1 px-4 py-2.5 bg-primary text-white rounded-lg font-bold disabled:opacity-50">
                                    {isSubmitting ? 'Saving...' : editingClass ? 'Save Changes' : 'Create Class'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Student Enrollment Modal */}
            {showEnrollModal && enrollClassId && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl max-h-[80vh] overflow-hidden flex flex-col">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-2xl font-bold">Manage Students</h3>
                            <button onClick={() => { setShowEnrollModal(false); setEnrollClassId(null); }} className="text-slate-400 hover:text-slate-600">
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto">
                            <p className="text-sm text-slate-500 mb-4">Toggle students to enroll/unenroll from this class:</p>
                            <div className="space-y-2">
                                {students.map(student => {
                                    const isEnrolled = enrolledStudents.some(e => e.id === student.id);
                                    return (
                                        <label key={student.id}
                                            className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${isEnrolled
                                                ? 'bg-primary/10 border-primary'
                                                : 'bg-slate-50 dark:bg-slate-700 border-slate-200 dark:border-slate-600 hover:border-primary/50'
                                            }`}>
                                            <input type="checkbox" checked={isEnrolled}
                                                onChange={() => toggleEnroll(student.id)}
                                                className="w-4 h-4 rounded border-slate-300" />
                                            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-sm font-bold text-primary">
                                                {student.name.charAt(0)}
                                            </div>
                                            <div>
                                                <p className="font-medium">{student.name}</p>
                                                <p className="text-sm text-slate-500">{student.email}{student.enrollmentId ? ` • ${student.enrollmentId}` : ''}</p>
                                            </div>
                                        </label>
                                    );
                                })}
                                {students.length === 0 && (
                                    <p className="text-center text-slate-400 py-8">No students available. Create student accounts first.</p>
                                )}
                            </div>
                        </div>
                        <div className="pt-4 border-t border-slate-200 dark:border-slate-700 mt-4">
                            <button onClick={() => { setShowEnrollModal(false); setEnrollClassId(null); }}
                                className="w-full px-4 py-2.5 bg-primary text-white rounded-lg font-bold">
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
