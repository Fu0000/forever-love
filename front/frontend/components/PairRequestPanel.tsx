import React, { useEffect, useState } from 'react';
import { Copy } from 'lucide-react';
import { Button } from './ui/Button';
import { storageService } from '../services/storage';
import type { IncomingPairRequest, OutgoingPairRequest } from '../types';

type Props = {
  myClientUserId: string | null | undefined;
  mode: 'onboarding' | 'dashboard';
  onSent?: () => void;
  onAccepted?: (couple: any) => void;
};

const targetPattern = /^(user_[A-Za-z0-9_-]{6,64}|usr_[a-f0-9]{20})$/;

export const PairRequestPanel: React.FC<Props> = ({
  myClientUserId,
  mode,
  onSent,
  onAccepted,
}) => {
  const [pairTargetId, setPairTargetId] = useState('');
  const [incomingRequests, setIncomingRequests] = useState<IncomingPairRequest[]>([]);
  const [outgoingRequests, setOutgoingRequests] = useState<OutgoingPairRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const testIds =
    mode === 'onboarding'
      ? {
          refresh: 'pair-requests-refresh',
          targetInput: 'pair-request-target-input',
          send: 'pair-request-send',
          myId: 'my-client-user-id',
          incomingItem: 'incoming-request-item',
          incomingAccept: 'incoming-request-accept',
          incomingReject: 'incoming-request-reject',
          outgoingItem: 'outgoing-request-item',
          outgoingCancel: 'outgoing-request-cancel',
        }
      : {
          refresh: 'dashboard-pair-requests-refresh',
          targetInput: 'dashboard-pair-request-target-input',
          send: 'dashboard-pair-request-send',
          myId: 'dashboard-my-client-user-id',
          incomingItem: 'dashboard-incoming-request-item',
          incomingAccept: 'dashboard-incoming-request-accept',
          incomingReject: 'dashboard-incoming-request-reject',
          outgoingItem: 'dashboard-outgoing-request-item',
          outgoingCancel: 'dashboard-outgoing-request-cancel',
        };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).catch(() => {
      prompt('复制:', text);
    });
  };

  const refresh = async () => {
    if (!storageService.hasToken()) return;
    setLoading(true);
    setError('');
    try {
      const [incoming, outgoing] = await Promise.all([
        storageService.listIncomingPairRequests(),
        storageService.listOutgoingPairRequests(),
      ]);
      setIncomingRequests(incoming);
      setOutgoingRequests(outgoing);
    } catch (e) {
      console.error('Failed to refresh pair requests', e);
      setError('加载配对申请失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const sendPairRequest = async () => {
    if (!pairTargetId.trim()) return;
    setLoading(true);
    setError('');
    try {
      const normalized = pairTargetId.trim();
      if (!targetPattern.test(normalized)) {
        setError('这里请输入对方配对ID（user_...）或用户ID（usr_...），不是6位配对码');
        return;
      }
      const result = await storageService.createPairRequest(normalized);
      setPairTargetId('');
      onSent?.();
      if (result?.couple && onAccepted) {
        onAccepted(result.couple);
        return;
      }
      await refresh();
    } catch (e) {
      console.error('Failed to send pair request', e);
      setError('发送失败，请检查配对ID或网络');
    } finally {
      setLoading(false);
    }
  };

  const acceptPairRequest = async (requestId: string) => {
    setLoading(true);
    setError('');
    try {
      const result = await storageService.acceptPairRequest(requestId);
      if (result?.couple && onAccepted) {
        onAccepted(result.couple);
        return;
      }
      await refresh();
    } catch (e) {
      console.error('Failed to accept pair request', e);
      setError('同意失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  const rejectPairRequest = async (requestId: string) => {
    setLoading(true);
    setError('');
    try {
      await storageService.rejectPairRequest(requestId);
      await refresh();
    } catch (e) {
      console.error('Failed to reject pair request', e);
      setError('拒绝失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  const cancelPairRequest = async (requestId: string) => {
    setLoading(true);
    setError('');
    try {
      await storageService.cancelPairRequest(requestId);
      await refresh();
    } catch (e) {
      console.error('Failed to cancel pair request', e);
      setError('取消失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-5 rounded-[1.5rem] border border-rose-100 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">
          配对申请
        </label>
        <button
          type="button"
          className="text-xs font-bold text-rose-500 hover:text-rose-600"
          onClick={refresh}
          disabled={loading}
          data-testid={testIds.refresh}
        >
          {loading ? '刷新中...' : '刷新'}
        </button>
      </div>

      <div className="mb-4">
        <p className="text-[11px] text-gray-500 font-bold mb-1">我的配对ID（给对方输入）</p>
        <div className="flex items-center justify-between gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2">
          <span
            className="font-mono text-[12px] font-black text-gray-700 truncate"
            data-testid={testIds.myId}
          >
            {myClientUserId ?? '—'}
          </span>
          <Button
            size="sm"
            variant="secondary"
            className="rounded-lg !px-3"
            onClick={() => copyToClipboard(myClientUserId ?? '')}
            disabled={!myClientUserId}
          >
            <Copy size={14} />
          </Button>
        </div>
      </div>

      <div className="flex gap-2">
        <input
          type="text"
          value={pairTargetId}
          onChange={(e) => setPairTargetId(e.target.value)}
          placeholder="输入对方配对ID（user_... 或 usr_...）"
          className="flex-1 px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-rose-400 outline-none text-center font-mono text-sm bg-white"
          data-testid={testIds.targetInput}
        />
        <Button
          className="px-6 rounded-xl"
          onClick={sendPairRequest}
          disabled={!pairTargetId.trim() || loading}
          data-testid={testIds.send}
        >
          发送
        </Button>
      </div>

      {error && (
        <p className="text-red-500 text-xs mt-2 ml-1 font-medium flex items-center">
          <span className="w-1.5 h-1.5 bg-red-500 rounded-full mr-1.5"></span>
          {error}
        </p>
      )}

      {incomingRequests.length > 0 && mode === 'onboarding' && (
        <div className="mt-4">
          <p className="text-[11px] text-gray-500 font-bold mb-2 ml-1">收到的申请</p>
          <div className="space-y-2">
            {incomingRequests.map((req) => (
              <div
                key={req.id}
                className="flex items-center justify-between gap-3 bg-rose-50 border border-rose-100 rounded-xl px-3 py-2"
                data-testid={testIds.incomingItem}
              >
                <div className="min-w-0">
                  <p className="text-sm font-black text-gray-800 truncate">{req.fromUser.name}</p>
                  <p className="text-[11px] text-gray-500 font-mono truncate">
                    {req.fromUser.clientUserId ?? ''}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    className="rounded-lg !px-3"
                    onClick={() => acceptPairRequest(req.id)}
                    disabled={loading}
                    data-testid={testIds.incomingAccept}
                  >
                    同意
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    className="rounded-lg !px-3"
                    onClick={() => rejectPairRequest(req.id)}
                    disabled={loading}
                    data-testid={testIds.incomingReject}
                  >
                    拒绝
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {outgoingRequests.length > 0 && (
        <div className="mt-4">
          <p className="text-[11px] text-gray-500 font-bold mb-2 ml-1">我发出的申请</p>
          <div className="space-y-2">
            {outgoingRequests.map((req) => (
              <div
                key={req.id}
                className="flex items-center justify-between gap-3 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2"
                data-testid={testIds.outgoingItem}
              >
                <div className="min-w-0">
                  <p className="text-sm font-black text-gray-800 truncate">{req.toUser.name}</p>
                  <p className="text-[11px] text-gray-500 font-mono truncate">
                    {req.toUser.clientUserId ?? ''}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="secondary"
                  className="rounded-lg !px-3"
                  onClick={() => cancelPairRequest(req.id)}
                  disabled={loading}
                  data-testid={testIds.outgoingCancel}
                >
                  取消
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
