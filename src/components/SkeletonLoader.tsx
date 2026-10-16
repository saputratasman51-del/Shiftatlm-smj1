/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

export function DashboardSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Top Banner Skeleton */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="h-6 bg-slate-200 rounded-lg w-48"></div>
          <div className="h-8 bg-slate-200 rounded-full w-28"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          <div className="h-24 bg-slate-100 rounded-xl"></div>
          <div className="h-24 bg-slate-100 rounded-xl"></div>
          <div className="h-24 bg-slate-100 rounded-xl"></div>
        </div>
      </div>

      {/* Main Content Grid Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 h-64 space-y-4">
            <div className="h-5 bg-slate-200 rounded-md w-40"></div>
            <div className="h-20 bg-slate-100 rounded-xl"></div>
            <div className="h-20 bg-slate-100 rounded-xl"></div>
          </div>
        </div>
        <div className="space-y-4">
          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 h-64 space-y-3">
            <div className="h-5 bg-slate-200 rounded-md w-32"></div>
            <div className="h-12 bg-slate-100 rounded-xl"></div>
            <div className="h-12 bg-slate-100 rounded-xl"></div>
            <div className="h-12 bg-slate-100 rounded-xl"></div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function JadwalSkeleton() {
  return (
    <div className="space-y-5 animate-pulse">
      {/* Header Skeleton */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-6 bg-slate-200 rounded-lg w-56"></div>
          <div className="h-3.5 bg-slate-100 rounded-md w-80"></div>
        </div>
        <div className="h-10 bg-slate-200 rounded-xl w-32"></div>
      </div>

      {/* Filters Skeleton */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 grid grid-cols-1 sm:grid-cols-4 gap-3">
        <div className="h-10 bg-slate-100 rounded-xl"></div>
        <div className="h-10 bg-slate-100 rounded-xl"></div>
        <div className="h-10 bg-slate-100 rounded-xl"></div>
        <div className="h-10 bg-slate-100 rounded-xl"></div>
      </div>

      {/* Grid Cards Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="bg-white rounded-2xl p-4 border border-slate-200/80 h-36 space-y-3">
            <div className="flex items-center justify-between">
              <div className="h-4 bg-slate-200 rounded w-24"></div>
              <div className="h-4 bg-slate-100 rounded w-20"></div>
            </div>
            <div className="flex items-center gap-3 pt-2">
              <div className="w-10 h-10 bg-slate-200 rounded-xl"></div>
              <div className="space-y-1.5 flex-1">
                <div className="h-4 bg-slate-200 rounded w-3/4"></div>
                <div className="h-3 bg-slate-100 rounded w-1/2"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function SerahTerimaSkeleton() {
  return (
    <div className="space-y-5 animate-pulse">
      {/* Header Skeleton */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-6 bg-slate-200 rounded-lg w-64"></div>
          <div className="h-3.5 bg-slate-100 rounded-md w-96"></div>
        </div>
        <div className="h-10 bg-slate-200 rounded-xl w-36"></div>
      </div>

      {/* Tab bar skeleton */}
      <div className="flex gap-2">
        <div className="h-10 bg-slate-200 rounded-xl w-32"></div>
        <div className="h-10 bg-slate-100 rounded-xl w-32"></div>
        <div className="h-10 bg-slate-100 rounded-xl w-32"></div>
      </div>

      {/* Content Form / Cards Skeleton */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 h-96 space-y-4">
        <div className="h-5 bg-slate-200 rounded-md w-48"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="h-14 bg-slate-100 rounded-xl"></div>
          <div className="h-14 bg-slate-100 rounded-xl"></div>
        </div>
        <div className="h-32 bg-slate-100 rounded-xl"></div>
      </div>
    </div>
  );
}
