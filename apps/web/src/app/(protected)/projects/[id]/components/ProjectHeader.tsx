import React, { useState } from 'react';
import { Project } from '../types';

interface ProjectHeaderProps {
  project: Project | null;
  searchQuery: string;
  setSearchQuery: (val: string) => void;
  priorityFilter: string;
  setPriorityFilter: (val: string) => void;
  onEditProject: () => void;
  onDeleteProject: () => void;
  onAddTask: () => void;
}

export function ProjectHeader({
  project,
  searchQuery,
  setSearchQuery,
  priorityFilter,
  setPriorityFilter,
  onEditProject,
  onDeleteProject,
  onAddTask,
}: ProjectHeaderProps) {
  const [isPriorityOpen, setIsPriorityOpen] = useState(false);

  return (
    <>
      <div className="mb-10 mt-2">
        <div className="flex justify-between items-start gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-start gap-3 group">
              <h1 className="text-2xl md:text-3xl font-bold text-text-primary tracking-tight break-words">{project?.name}</h1>
              <div className="opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 shrink-0 mt-1 md:mt-2">
                <button
                  onClick={onEditProject}
                  className="p-1.5 text-text-secondary hover:text-text-primary rounded hover:bg-surface-hover transition-colors"
                  title="Edit Project"
                >
                  <span className="text-sm">✎</span>
                </button>
                <button
                  onClick={onDeleteProject}
                  className="p-1.5 text-[#EF4444] md:text-text-secondary md:hover:text-[#EF4444] rounded hover:bg-[#EF4444]/10 transition-colors"
                  title="Delete Project"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" /></svg>
                </button>
              </div>
            </div>
            <p className="mt-3 text-sm md:text-base text-text-secondary max-w-3xl leading-relaxed">{project?.description || 'No description provided.'}</p>
          </div>
          <button
            onClick={onAddTask}
            className="flex-shrink-0 inline-flex items-center gap-2 px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-lg text-bg bg-accent hover:bg-accent/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-surface focus:ring-accent transition-colors mt-1"
          >
            <span className="text-lg leading-none">+</span> Add Task
          </button>
        </div>
      </div>

      <div className="mb-6 flex flex-row gap-3 items-center w-full">
        <div className="flex-1 relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary/60 w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
          <input
            type="text"
            placeholder="Search tasks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-surface border border-border text-text-primary placeholder-text-secondary rounded-lg focus:outline-none focus:ring-1 focus:ring-accent focus:border-accent text-sm transition-colors"
          />
        </div>
        <div className="relative shrink-0">
          <button
            onClick={() => setIsPriorityOpen(!isPriorityOpen)}
            className="flex items-center gap-2 bg-surface border border-border text-text-primary rounded-lg py-1.5 px-3 hover:border-text-secondary focus:outline-none focus:ring-1 focus:ring-accent text-sm transition-all"
          >
            <span className="text-text-secondary/70">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 3c2.755 0 5.455.232 8.083.678.533.09.917.556.917 1.096v1.044a2.25 2.25 0 0 1-.659 1.591l-5.432 5.432a2.25 2.25 0 0 0-.659 1.591v2.927a2.25 2.25 0 0 1-1.244 2.013L9.75 21v-6.568a2.25 2.25 0 0 0-.659-1.591L3.659 7.409A2.25 2.25 0 0 1 3 5.818V4.774c0-.54.384-1.006.917-1.096A48.32 48.32 0 0 1 12 3Z" />
              </svg>
            </span>
            <span className="font-medium hidden sm:inline-block">{priorityFilter === '' ? 'All Priorities' : priorityFilter === 'LOW' ? 'Low Priority' : priorityFilter === 'MEDIUM' ? 'Medium Priority' : 'High Priority'}</span>
            <span className="font-medium sm:hidden">{priorityFilter === '' ? 'All' : priorityFilter === 'LOW' ? 'Low' : priorityFilter === 'MEDIUM' ? 'Med' : 'High'}</span>
          </button>
          {isPriorityOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setIsPriorityOpen(false)}></div>
              <div className="absolute right-0 mt-2 w-40 bg-surface border border-border rounded-xl shadow-lg z-20 overflow-hidden transform opacity-100 scale-100 transition-all duration-200 origin-top-right">
                <ul className="py-1">
                  {[
                    { value: '', label: 'All Priorities' },
                    { value: 'LOW', label: 'Low' },
                    { value: 'MEDIUM', label: 'Medium' },
                    { value: 'HIGH', label: 'High' }
                  ].map((option) => (
                    <li key={option.value}>
                      <button
                        onClick={() => {
                          setPriorityFilter(option.value);
                          setIsPriorityOpen(false);
                        }}
                        className={`w-full text-left px-4 py-2 text-sm transition-colors ${priorityFilter === option.value ? 'bg-accent/10 text-accent font-medium' : 'text-text-secondary hover:bg-surface-hover hover:text-text-primary'}`}
                      >
                        {option.label}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
