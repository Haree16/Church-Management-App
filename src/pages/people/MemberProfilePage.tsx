import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { memberService } from '@/services/memberService';
import {
  ChurchMember,
  AttendanceRecord,
  Donation,
  PrayerRequest,
  FollowUp,
} from '@/types/database';
import { Member } from '@/types';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ErrorState } from '@/components/ui/error-state';
import { MemberFormDialog } from '@/components/people/MemberFormDialog';
import { Member360Profile } from '@/components/people/Member360Profile';
import { financeService } from '@/services/financeService';
import { ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

export function MemberProfilePage() {
  const { id } = useParams<{ id: string }>();
  const { activeChurch, currentRole } = useAuth();
  const navigate = useNavigate();

  const [churchMember, setChurchMember] = useState<ChurchMember | null>(null);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [donations, setDonations] = useState<Donation[]>([]);
  const [prayerRequests, setPrayerRequests] = useState<PrayerRequest[]>([]);
  const [followUps, setFollowUps] = useState<FollowUp[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);

  const loadMemberData = async () => {
    if (!activeChurch || !id) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await memberService.getMemberById(activeChurch.id, id);
      if (!data.member) {
        setError('Member profile not found');
      } else {
        setChurchMember(data.member);
        setAttendance(data.attendance);
        setDonations(data.donations);
        setPrayerRequests(data.prayerRequests);
        setFollowUps(data.followUps);
      }
    } catch (err: any) {
      console.error('Failed to load member profile:', err);
      setError(err.message || 'Failed to load member data.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadMemberData();
  }, [activeChurch, id]);

  const handleUpdateMember = async (payload: any) => {
    if (!activeChurch || !churchMember) return;
    const updated = await memberService.updateMember(activeChurch.id, churchMember.id, payload);
    setChurchMember(updated);
    toast.success('Member profile updated successfully!');
  };

  // Convert ChurchMember to Member for Member360Profile component
  const normalizedMember: Member | null = React.useMemo(() => {
    if (!churchMember) return null;
    const prof = churchMember.profile;
    return {
      id: churchMember.id,
      church_id: churchMember.church_id,
      churchId: churchMember.church_id,
      firstName: prof?.first_name || 'Member',
      lastName: prof?.last_name || '',
      email: prof?.email || '',
      phone: prof?.phone || '',
      address: prof?.address || '',
      city: prof?.city || '',
      state: prof?.state || '',
      zipCode: prof?.postal_code || '',
      avatarUrl: prof?.avatar_url || undefined,
      status: (churchMember.status as any) || 'Member',
      joinedDate: churchMember.joined_date || churchMember.membership_date || new Date().toISOString().split('T')[0],
      birthdate: prof?.dob || undefined,
      anniversary: prof?.marriage_date || undefined,
      familyMembers: [],
      ministryTeams: churchMember.ministry?.name ? [churchMember.ministry.name as any] : [],
      availability: [],
      skills: [],
      pastoralNotes: churchMember.notes || undefined,
      isPrivateNotes: true,
      createdAt: churchMember.created_at,
    };
  }, [churchMember]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-44 w-full rounded-2xl" />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map((n) => (
            <Skeleton key={n} className="h-24 w-full rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (error || !normalizedMember) {
    return (
      <div className="space-y-4">
        <Button variant="outline" size="sm" onClick={() => navigate('/people/members')}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Members
        </Button>
        <ErrorState message={error || 'Member not found'} onRetry={loadMemberData} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Back Navigation */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate('/people/members')}
          className="h-8 gap-1.5 text-xs"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Directory
        </Button>
      </div>

      {/* Render 360° Profile */}
      <Member360Profile
        member={normalizedMember}
        currentRole={currentRole || 'Pastor'}
        onClose={() => navigate('/people/members')}
        onEdit={() => setIsEditOpen(true)}
      />

      {/* Edit Dialog */}
      <MemberFormDialog
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        onSave={handleUpdateMember}
        initialData={churchMember}
        mode="edit"
      />
    </div>
  );
}
