import React from 'react';
import { Link } from '../components/ui';

const EventFeed = () => {
  const newsItems = [
    {
      title: "ECK 2.15 Released: Enhanced Autoscaling",
      date: "NOVEMBER 4, 2025",
      isNew: true,
    },
    {
      title: "Elasticsearch 8.13 brings vector search improvements",
      date: "NOVEMBER 1, 2025",
      isNew: true,
    },
    {
      title: "Best practices for Kubernetes resource management",
      date: "OCTOBER 28, 2025",
      isNew: true,
    },
  ];

  const communityEvents = [
    {
      title: "Getting Started with ECK on Kubernetes",
      description: "Learn how to deploy and manage Elasticsearch clusters on Kubernetes using the Elastic Cloud on Kubernetes operator.",
      date: "NOVEMBER 6, 10:00",
    },
    {
      title: "Advanced ECK: Multi-cluster deployments",
      date: "NOVEMBER 8, 14:00",
    },
    {
      title: "Observability with Elastic Stack on Kubernetes",
      date: "NOVEMBER 10, 11:00",
    },
  ];

  return (
    <div className="space-y-6">
      {/* News Section */}
      <div className="bg-elastic-dark-700 border border-elastic-dark-600 rounded-lg p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-full bg-elastic-dark-600 flex items-center justify-center">
            <svg className="w-5 h-5 text-elastic-text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-elastic-text-primary">News</h2>
        </div>

        <div className="space-y-5">
          {newsItems.map((item, index) => (
            <div key={index}>
              <Link className="block text-elastic-blue-600 hover:text-elastic-blue-500 mb-1">
                {item.title}
              </Link>
              <div className="flex items-center gap-3">
                <span className="text-xs text-elastic-text-secondary">{item.date}</span>
                {item.isNew && (
                  <span className="text-xs font-medium text-pink-500">New!</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Community Section */}
      <div className="bg-elastic-dark-700 border border-elastic-dark-600 rounded-lg p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-full bg-elastic-dark-600 flex items-center justify-center">
            <svg className="w-5 h-5 text-elastic-text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-elastic-text-primary">Community</h2>
        </div>

        <div className="mb-6">
          <h3 className="text-elastic-blue-600 hover:text-elastic-blue-500 mb-2 cursor-pointer">
            Join an ElasticON event
          </h3>
          <p className="text-sm text-elastic-text-secondary leading-relaxed">
            Hear success stories, lessons learned, tips, tricks, best practices, and funny anecdotes from Elastic experts from all over the world.
          </p>
        </div>

        <div className="space-y-5 mb-6">
          {communityEvents.map((event, index) => (
            <div key={index}>
              <Link className="block text-elastic-blue-600 hover:text-elastic-blue-500 mb-1">
                {event.title}
              </Link>
              {event.description && (
                <p className="text-xs text-elastic-text-secondary mb-1">{event.description}</p>
              )}
              <span className="text-xs text-elastic-text-secondary">{event.date}</span>
            </div>
          ))}
        </div>

        <button className="w-full bg-elastic-blue-700 hover:bg-elastic-blue-600 text-white font-medium py-2 px-4 rounded transition-colors">
          Events portal
        </button>
      </div>
    </div>
  );
};

export default EventFeed;
