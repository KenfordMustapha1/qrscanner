import React, { useMemo, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import api, { API_ROOT_URL } from '../../utils/api';

const MyProfile = () => {
  const { me } = useOutletContext();
  const employee = me?.employee;

  const [photoUrl, setPhotoUrl] = useState(employee?.profilePhotoUrl || '');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const resolvedPhotoSrc = useMemo(() => {
    if (!photoUrl) return '';
    if (/^https?:\/\//i.test(photoUrl)) return photoUrl;
    return `${API_ROOT_URL}${photoUrl.startsWith('/') ? '' : '/'}${photoUrl}`;
  }, [photoUrl]);

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be smaller than 5MB.');
      return;
    }

    setError('');
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('photo', file);

      const res = await api.post('/employee/profile-photo', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (res.data?.profilePhotoUrl) {
        setPhotoUrl(res.data.profilePhotoUrl);
      }
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to upload profile photo. Please try again.';
      setError(message);
    } finally {
      setUploading(false);
    }
  };

  if (!employee) {
    return (
      <div className="emp-card">
        <div className="emp-card-title">My Profile</div>
        <div className="emp-empty">Unable to load your profile.</div>
      </div>
    );
  }

  return (
    <div className="emp-card">
      <div className="emp-card-title">My Profile</div>
      <div className="emp-profile">
        <div className="emp-profile-photo">
          {resolvedPhotoSrc ? (
            <img src={resolvedPhotoSrc} alt="Profile" />
          ) : (
            <div className="emp-profile-initial">
              {(employee.name || 'E').charAt(0).toUpperCase()}
            </div>
          )}

          <label className="emp-photo-upload-btn">
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              disabled={uploading}
              style={{ display: 'none' }}
            />
            {uploading ? 'Uploading…' : 'Change Photo'}
          </label>
        </div>

        <div className="emp-profile-meta">
          <div className="emp-profile-name">{employee.name || '—'}</div>
          <div className="emp-profile-sub">
            {employee.employeeId || '—'} {employee.department ? `• ${employee.department}` : ''}
          </div>
        </div>
      </div>

      {error && <div className="alert alert-error" style={{ marginTop: '0.75rem' }}>{error}</div>}

      <div className="emp-detail-grid">
        <div className="emp-detail-row">
          <div className="emp-detail-label">Employee ID</div>
          <div className="emp-detail-value">{employee.employeeId || '—'}</div>
        </div>
        <div className="emp-detail-row">
          <div className="emp-detail-label">Full Name</div>
          <div className="emp-detail-value">{employee.name || '—'}</div>
        </div>
        <div className="emp-detail-row">
          <div className="emp-detail-label">Department</div>
          <div className="emp-detail-value">{employee.department || '—'}</div>
        </div>
        <div className="emp-detail-row">
          <div className="emp-detail-label">Position</div>
          <div className="emp-detail-value">{employee.position || '—'}</div>
        </div>
        <div className="emp-detail-row">
          <div className="emp-detail-label">Email</div>
          <div className="emp-detail-value">{employee.email || '—'}</div>
        </div>
      </div>
    </div>
  );
};

export default MyProfile;

