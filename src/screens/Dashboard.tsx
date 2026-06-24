import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Switch, ScrollView, Alert, ActivityIndicator, TextInput, Image, Modal, Platform } from 'react-native';
import Svg, { Path, Rect, Circle, Line, Polyline } from 'react-native-svg';
import supabase from '../services/api';
import { Audio } from 'expo-av';
import { theme } from '../theme/theme';

// --- CUSTOM SVG ICONS FOR SELF-CONTAINED LEGIBILITY ---
const DutyIcon = ({ color }: { color: string }) => (
  <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M22 12h-4l-3 9L9 3l-3 9H2" />
  </Svg>
);

const FinanceIcon = ({ color }: { color: string }) => (
  <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
    <Rect x="2" y="4" width="20" height="16" rx="2" ry="2" />
    <Line x1="12" y1="10" x2="12" y2="14" />
    <Path d="M17 12H7" />
  </Svg>
);

const StarIcon = ({ color }: { color: string }) => (
  <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
  </Svg>
);

const PortalIcon = ({ color }: { color: string }) => (
  <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <Circle cx="12" cy="7" r="4" />
  </Svg>
);

const PhoneIcon = ({ color }: { color: string }) => (
  <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
  </Svg>
);

const SupportIcon = ({ color }: { color: string }) => (
  <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
    <Circle cx="12" cy="12" r="10" />
    <Path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
    <Line x1="12" y1="17" x2="12.01" y2="17" />
  </Svg>
);

const CloseIcon = ({ color }: { color: string }) => (
  <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
    <Line x1="18" y1="6" x2="6" y2="18" />
    <Line x1="6" y1="6" x2="18" y2="18" />
  </Svg>
);

const BellIcon = ({ color }: { color: string }) => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0" />
  </Svg>
);

const RESTAURANT_NAMES: { [key: string]: string } = {
  res_1: 'Ishtaa Pure Veg',
  res_2: 'Jain Bhoj',
  res_3: 'Sattvik Kitchen',
  res_4: 'Green Garden Bowls',
  res_5: 'Organic Roots',
  res_6: 'Prasadam Bhavan',
  res_7: 'Vrinda Veg Express',
  res_8: 'Ayur Kitchen'
};

const RESTAURANT_DISTANCES: { [key: string]: string } = {
  res_1: '1.8 km',
  res_2: '2.4 km',
  res_3: '3.1 km',
  res_4: '1.2 km',
  res_5: '4.5 km',
  res_6: '2.0 km',
  res_7: '1.5 km',
  res_8: '3.7 km'
};

const getRestaurantName = (id: string) => {
  return RESTAURANT_NAMES[id] || 'VegDash Partner Kitchen';
};

const getRestaurantDistance = (id: string) => {
  return RESTAURANT_DISTANCES[id] || '2.0 km';
};


interface RiderSession {
  name: string;
  email: string;
  avatar: string;
  phone?: string;
  documents?: any;
}

interface DashboardProps {
  rider: RiderSession;
  onLogout: () => void;
  onUpdateRider?: (updated: RiderSession) => void;
}

const LeafletMap: React.FC<{
  restaurantLat: number;
  restaurantLng: number;
  customerLat: number;
  customerLng: number;
  riderLat: number;
  riderLng: number;
  stage: 'to_store' | 'to_customer';
}> = ({ restaurantLat, restaurantLng, customerLat, customerLng, riderLat, riderLng, stage }) => {
  const mapRef = React.useRef<HTMLDivElement | null>(null);
  const leafletMapInstance = React.useRef<any>(null);
  const riderMarkerRef = React.useRef<any>(null);
  const pathPolylineRef = React.useRef<any>(null);
  const [mapLibLoaded, setMapLibLoaded] = React.useState(typeof window !== 'undefined' && !!(window as any).L);

  React.useEffect(() => {
    if (mapLibLoaded) return;
    const interval = setInterval(() => {
      if (typeof window !== 'undefined' && (window as any).L) {
        setMapLibLoaded(true);
        clearInterval(interval);
      }
    }, 100);
    return () => clearInterval(interval);
  }, [mapLibLoaded]);

  React.useEffect(() => {
    if (Platform.OS !== 'web' || !mapLibLoaded) return;
    const L = (window as any).L;
    if (!L || !mapRef.current) return;

    if (!leafletMapInstance.current) {
      const map = L.map(mapRef.current, {
        zoomControl: false,
        attributionControl: false
      }).setView([restaurantLat, restaurantLng], 15);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
      }).addTo(map);

      leafletMapInstance.current = map;

      // Add Restaurant marker
      const restIcon = L.divIcon({
        className: 'custom-rest-icon',
        html: `<div style="background-color: #0A3B2E; width: 24px; height: 24px; border-radius: 50%; border: 3px solid #ffffff; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"><span style="color: white; font-size: 10px; font-weight: bold;">R</span></div>`,
        iconSize: [24, 24],
        iconAnchor: [12, 12]
      });
      L.marker([restaurantLat, restaurantLng], { icon: restIcon }).addTo(map);

      // Add Customer marker
      const custIcon = L.divIcon({
        className: 'custom-cust-icon',
        html: `<div style="background-color: #C7A96B; width: 24px; height: 24px; border-radius: 50%; border: 3px solid #ffffff; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"><span style="color: white; font-size: 10px; font-weight: bold;">C</span></div>`,
        iconSize: [24, 24],
        iconAnchor: [12, 12]
      });
      L.marker([customerLat, customerLng], { icon: custIcon }).addTo(map);

      // Add Rider marker
      const riderIcon = L.divIcon({
        className: 'custom-rider-icon',
        html: `<div style="background-color: #0B4D3A; width: 28px; height: 28px; border-radius: 50%; border: 3px solid #ffffff; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 6px rgba(0,0,0,0.4);"><span style="color: white; font-size: 12px; display: block; text-align: center; line-height: 22px;">🏍️</span></div>`,
        iconSize: [28, 28],
        iconAnchor: [14, 14]
      });
      riderMarkerRef.current = L.marker([riderLat, riderLng], { icon: riderIcon }).addTo(map);

      // Draw route path line
      const pathPoints = stage === 'to_store' 
        ? [[riderLat, riderLng], [restaurantLat, restaurantLng]]
        : [[restaurantLat, restaurantLng], [customerLat, customerLng]];
      
      pathPolylineRef.current = L.polyline(pathPoints, {
        color: stage === 'to_store' ? '#0B4D3A' : '#C7A96B',
        weight: 5,
        opacity: 0.8,
        dashArray: stage === 'to_store' ? '5, 10' : undefined
      }).addTo(map);

      // Fit map to show both markers
      try {
        map.fitBounds(pathPolylineRef.current.getBounds(), { padding: [40, 40] });
      } catch (err) {
        console.error('fitBounds error:', err);
      }
    } else {
      const map = leafletMapInstance.current;
      // Update rider position
      if (riderMarkerRef.current) {
        riderMarkerRef.current.setLatLng([riderLat, riderLng]);
      }
      // Update polyline path
      if (pathPolylineRef.current) {
        const pathPoints = stage === 'to_store'
          ? [[riderLat, riderLng], [restaurantLat, restaurantLng]]
          : [[restaurantLat, restaurantLng], [customerLat, customerLng]];
        pathPolylineRef.current.setLatLngs(pathPoints);
        pathPolylineRef.current.setStyle({
          color: stage === 'to_store' ? '#0B4D3A' : '#C7A96B',
          dashArray: stage === 'to_store' ? '5, 10' : null
        });
      }
    }
  }, [riderLat, riderLng, stage, restaurantLat, restaurantLng, customerLat, customerLng, mapLibLoaded]);

  // Cleanup on unmount
  React.useEffect(() => {
    return () => {
      if (leafletMapInstance.current) {
        leafletMapInstance.current.remove();
        leafletMapInstance.current = null;
      }
    };
  }, []);

  if (Platform.OS !== 'web') {
    return null;
  }

  return <div ref={mapRef} style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, borderRadius: '12px' }} />;
};

export const Dashboard: React.FC<DashboardProps> = ({ rider, onLogout, onUpdateRider }) => {
  // Bottom Tab navigation
  const [activeTab, setActiveTab] = useState<'duty' | 'finance' | 'performance' | 'portal'>('duty');
  const [isOnline, setIsOnline] = useState(true);
  
  // Real-time order management
  const [activeOrder, setActiveOrder] = useState<any | null>(null);
  const [availableJobs, setAvailableJobs] = useState<any[]>([]);
  const [jobsLoading, setJobsLoading] = useState(false);
  const [newOrderAlert, setNewOrderAlert] = useState<any | null>(null);
  const [alertCountdown, setAlertCountdown] = useState(60);
  const [ignoredJobIds, setIgnoredJobIds] = useState<string[]>([]);


  // Active en-route step controls
  const [deliveryStage, setDeliveryStage] = useState<'to_store' | 'at_store' | 'to_customer'>('to_store');
  const [itemChecklist, setItemChecklist] = useState<{ [key: string]: boolean }>({});
  const [progress, setProgress] = useState(0);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  // Support / Tickets Form
  const [faqExpanded, setFaqExpanded] = useState<number | null>(null);
  const [ticketCategory, setTicketCategory] = useState('Payment Issue');
  const [ticketDesc, setTicketDesc] = useState('');
  const [supportTickets, setSupportTickets] = useState<any[]>([]);
  const [submittingTicket, setSubmittingTicket] = useState(false);

  // Document modal viewer
  const [showDocModal, setShowDocModal] = useState(false);

  // Notifications
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([
    { id: 1, title: 'Rain Surge Active! 🌧️', body: 'Earn ₹15 extra on every delivery today due to bad weather conditions.', time: '10m ago' },
    { id: 2, title: 'Incentive Met 🎉', body: 'Nice work! You achieved the Daily Lunch Peak incentive of ₹50.', time: '2h ago' },
    { id: 3, title: 'Security Alert 🔐', body: 'Rider portal coordinates verified successfully. Stay safe on the road!', time: '1d ago' }
  ]);

  // Settings
  const [prefSound, setPrefSound] = useState(true);
  const [prefVib, setPrefVib] = useState(true);
  const [prefRain, setPrefRain] = useState(false);

  // Profile fields editing
  const [editName, setEditName] = useState(rider.name);
  const [editEmail, setEditEmail] = useState(rider.email);
  const [editPhone, setEditPhone] = useState(rider.phone || '9876543210');
  const [savingProfile, setSavingProfile] = useState(false);

  // Finance logs
  const [history, setHistory] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [walletBalance, setWalletBalance] = useState(350);
  const [enteredOtp, setEnteredOtp] = useState('');
  const [otpVerifying, setOtpVerifying] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [cashoutLoading, setCashoutLoading] = useState(false);

  const progressRef = useRef(0);
  const progressIntervalRef = useRef<any>(null);
  const alertTimerRef = useRef<any>(null);

  const fetchAvailableJobs = async () => {
    if (!isOnline || activeOrder || newOrderAlert) {
      setAvailableJobs([]);
      return;
    }
    try {
      setJobsLoading(true);
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('orderStatus', 'ready_for_pickup')
        .order('createdAt', { ascending: false });

      if (error) throw error;
      
      const uniqueMap = new Map();
      (data || []).forEach(o => {
        const isUnassigned = !o.driver || o.driver.includes('Assigning partner');
        const isIgnored = ignoredJobIds.includes(o._id);
        const isFromVegdashUser = o.customer && 
          /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(o.customer);

        if (isUnassigned && !isIgnored && isFromVegdashUser) {
          uniqueMap.set(o._id, o);
        }
      });
      const uniqueUnassigned = Array.from(uniqueMap.values());
      setAvailableJobs(uniqueUnassigned);
    } catch (err) {
      console.error('Error fetching pickups:', err);
    } finally {
      setJobsLoading(false);
    }
  };


  const fetchHistory = async () => {
    try {
      setHistoryLoading(true);
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('orderStatus', 'delivered')
        .order('createdAt', { ascending: false });

      if (error) throw error;

      const riderHistory = (data || []).filter(o => {
        if (!o.driver) return false;
        try {
          const parsed = typeof o.driver === 'string' ? JSON.parse(o.driver) : o.driver;
          return parsed.email === rider.email || parsed.name === rider.name;
        } catch (_) {
          return false;
        }
      });
      setHistory(riderHistory);
    } catch (err) {
      console.error('Error fetching history:', err);
    } finally {
      setHistoryLoading(false);
    }
  };

  const fetchActiveOrderOnMount = async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .in('orderStatus', ['ready_for_pickup', 'out_for_delivery']);

      if (error) throw error;

      const active = (data || []).find(o => {
        if (!o.driver) return false;
        try {
          const parsed = typeof o.driver === 'string' ? JSON.parse(o.driver) : o.driver;
          
          // Only restore if updated in the last 2 hours to avoid loading old stale orders
          const lastUpdated = new Date(o.updatedAt).getTime();
          const twoHoursAgo = Date.now() - 2 * 60 * 60 * 1000;
          if (lastUpdated < twoHoursAgo) return false;

          return parsed.email === rider.email || parsed.name === rider.name;
        } catch (_) {
          return false;
        }
      });

      if (active) {
        setActiveOrder(active);
        if (active.orderStatus === 'ready_for_pickup') {
          setDeliveryStage('to_store');
        } else if (active.orderStatus === 'out_for_delivery') {
          setDeliveryStage('to_customer');
        }
      }
    } catch (err) {
      console.error('Error fetching active order on mount:', err);
    }
  };

  useEffect(() => {
    fetchActiveOrderOnMount();
    fetchHistory();
  }, []);

  useEffect(() => {
    fetchAvailableJobs();
  }, [isOnline, activeOrder, newOrderAlert, ignoredJobIds]);


  // Subscriptions to PostgreSQL realtime orders table changes
  useEffect(() => {
    if (!isOnline || activeOrder) return;

    const channel = supabase
      .channel('rider-realtime-dashboard-sync')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders' },
        (payload: any) => {
          fetchAvailableJobs();
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            const order = payload.new;
            const isReady = order.orderStatus === 'ready_for_pickup';
            const isUnassigned = !order.driver || order.driver.includes('Assigning partner');
            const isIgnored = ignoredJobIds.includes(order._id);
            const isFromVegdashUser = order.customer && 
              /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(order.customer);

            if (isReady && isUnassigned && !isIgnored && isFromVegdashUser) {
              triggerNewOrderAlert(order);
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isOnline, activeOrder, newOrderAlert, ignoredJobIds]);

  // Subscribe to changes on the active order
  useEffect(() => {
    if (!activeOrder) return;

    const channel = supabase
      .channel(`active-order-${activeOrder._id}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'orders', filter: `_id=eq.${activeOrder._id}` },
        (payload: any) => {
          const updatedOrder = payload.new;
          console.log('Active order updated:', updatedOrder);
          
          setActiveOrder((prev: any) => {
            if (!prev) return null;
            return {
              ...prev,
              ...updatedOrder
            };
          });

          // Automatically advance stages on status transitions
          if (updatedOrder.status === 'out_for_delivery' || updatedOrder.orderStatus === 'out_for_delivery') {
            setDeliveryStage('to_customer');
            setProgress(0);
          } else if (updatedOrder.status === 'ready_for_pickup' || updatedOrder.orderStatus === 'ready_for_pickup') {
            if (updatedOrder.rider_id) {
              setDeliveryStage('to_store');
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeOrder?._id]);

  const playNotificationSound = async () => {
    if (!prefSound) return;
    try {
      if (Platform.OS === 'web') {
        if (typeof window !== 'undefined' && (window as any).Audio) {
          const audio = new (window as any).Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-500.wav');
          audio.play().catch((e: any) => console.log('Web audio play error:', e));
        }
      } else {
        await Audio.setAudioModeAsync({
          playsInSilentModeIOS: true,
          staysActiveInBackground: true,
          playThroughEarpieceAndroid: false,
        }).catch(e => console.log('setAudioModeAsync error:', e));

        const { sound } = await Audio.Sound.createAsync(
          { uri: 'https://assets.mixkit.co/active_storage/sfx/2869/2869-500.wav' }
        );
        await sound.playAsync();
        setTimeout(() => {
          sound.unloadAsync().catch(() => {});
        }, 3000);
      }
    } catch (err) {
      console.log('Play sound error:', err);
    }
  };

  // Flashing Order Alert Modal countdown
  const triggerNewOrderAlert = (job: any) => {
    setNewOrderAlert(job);
    setAlertCountdown(60);
    playNotificationSound();

    // Add order to notifications array so it displays in notifications list
    const newNotif = {
      id: Date.now(),
      title: 'New Order Offer 🛍️',
      body: `Order #VD${job._id.substring(job._id.length - 6).toUpperCase()} is ready for pickup at ${job.restaurantName || 'Sattvik Kitchen'}.`,
      time: 'Just now'
    };
    setNotifications(prev => [newNotif, ...prev]);

    if (alertTimerRef.current) clearInterval(alertTimerRef.current);

    alertTimerRef.current = setInterval(() => {
      setAlertCountdown(prev => {
        if (prev <= 1) {
          clearInterval(alertTimerRef.current);
          setNewOrderAlert(null);
          return 60;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // Live GPS tracking en-route every 5s (to store or to customer)
  useEffect(() => {
    if (activeOrder && (deliveryStage === 'to_store' || deliveryStage === 'to_customer')) {
      progressRef.current = 0;
      setProgress(0);

      let tickCount = 0;
      let hasSetArriving = false;

      progressIntervalRef.current = setInterval(async () => {
        progressRef.current = Math.min(progressRef.current + 0.1, 1.0);
        const currentProgress = progressRef.current;
        setProgress(currentProgress);

        let currentLat = 17.4483;
        let currentLng = 78.3741;

        if (deliveryStage === 'to_store') {
          const riderLat = 17.4520;
          const riderLng = 78.3680;
          const restLat = 17.4483;
          const restLng = 78.3741;
          currentLat = riderLat + (restLat - riderLat) * currentProgress;
          currentLng = riderLng + (restLng - riderLng) * currentProgress;
        } else if (deliveryStage === 'to_customer') {
          const restLat = 17.4483;
          const restLng = 78.3741;
          const custLat = 17.4435;
          const custLng = 78.3812;
          currentLat = restLat + (custLat - restLat) * currentProgress;
          currentLng = restLng + (custLng - restLng) * currentProgress;
        }

        let parsedDriver: any = {};
        if (activeOrder.driver) {
          try {
            parsedDriver = typeof activeOrder.driver === 'string' 
              ? JSON.parse(activeOrder.driver) 
              : activeOrder.driver;
          } catch (_) {}
        }

        const driverObj = {
          ...parsedDriver,
          name: rider.name,
          email: rider.email,
          avatar: rider.avatar,
          phone: editPhone,
          location: {
            lat: currentLat,
            lng: currentLng,
            progress: currentProgress,
            stage: deliveryStage
          }
        };

        // 1. Send via Realtime Broadcast Channel
        try {
          const trackChannel = supabase.channel(`order-tracking:${activeOrder._id}`);
          trackChannel.send({
            type: 'broadcast',
            event: 'location-update',
            payload: {
              lat: currentLat,
              lng: currentLng,
              progress: currentProgress,
              stage: deliveryStage
            }
          });
        } catch (err) {
          console.error('GPS broadcast send error:', err);
        }

        // 2. Persist to DB Fallback (every 20s = 4 ticks of 5s)
        tickCount++;
        if (tickCount % 4 === 0 || currentProgress >= 1.0) {
          try {
            await supabase.rpc('update_rider_location', {
              p_order_id: activeOrder._id,
              p_lat: currentLat,
              p_lng: currentLng,
              p_progress: currentProgress,
              p_stage: deliveryStage,
              p_driver_json: driverObj
            });
          } catch (dbErr) {
            console.error('GPS DB persist error:', dbErr);
          }
        }

        // Update status to arriving when progress >= 80% (0.8) en-route to customer
        if (deliveryStage === 'to_customer' && currentProgress >= 0.8 && currentProgress < 1.0 && !hasSetArriving) {
          hasSetArriving = true;
          try {
            const now = new Date().toISOString();
            const statusHistoryUpdate = [
              ...(activeOrder.statusHistory || []),
              { status: 'arriving', timestamp: now }
            ];
            await supabase
              .from('orders')
              .update({
                orderStatus: 'arriving',
                statusHistory: statusHistoryUpdate,
                updatedAt: now
              })
              .eq('_id', activeOrder._id);

            setActiveOrder((prev: any) => {
              if (!prev) return prev;
              return {
                ...prev,
                orderStatus: 'arriving',
                status: 'arriving',
                statusHistory: statusHistoryUpdate
              };
            });
          } catch (err) {
            console.error('Failed to update status to arriving:', err);
          }
        }

        if (currentProgress >= 1.0) {
          clearInterval(progressIntervalRef.current);
          
          if (deliveryStage === 'to_customer') {
            const currentOrderId = activeOrder._id;
            setTimeout(async () => {
              try {
                const { error } = await supabase.rpc('mark_order_delivered', { p_order_id: currentOrderId });
                if (error) throw error;

                console.log('Auto-delivered order in testing/mock mode.');
                setActiveOrder((prev: any) => {
                  if (prev && prev._id === currentOrderId) {
                    setWalletBalance(w => w + 50);
                    setDeliveryStage('to_store');
                    setProgress(0);
                    fetchHistory();
                    return null;
                  }
                  return prev;
                });
              } catch (err: any) {
                console.error('Failed auto-delivering order:', err.message);
              }
            }, 5000);
          }
        }
      }, 5000);
    }

    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };
  }, [activeOrder?._id, deliveryStage]);


  const handleAcceptOrder = async (job: any) => {
    if (alertTimerRef.current) clearInterval(alertTimerRef.current);
    setNewOrderAlert(null);
    setUpdatingStatus(true);

    try {
      let riderId = '';
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (!userError && userData?.user) {
        riderId = userData.user.id;
        // Make sure this user exists in public.users
        const { data: userCheck } = await supabase
          .from('users')
          .select('_id')
          .eq('_id', riderId)
          .single();
        if (!userCheck) {
          console.log('Rider auth user not in public.users, upserting...');
          await supabase.from('users').upsert({
            _id: riderId,
            email: rider.email,
            name: rider.name,
            role: 'rider',
            phone: editPhone
          });
        }
      } else {
        console.log('getUser() failed, querying public.users for email:', rider.email);
        const { data: users, error: dbError } = await supabase
          .from('users')
          .select('_id')
          .eq('email', rider.email)
          .single();
        if (!dbError && users?._id) {
          riderId = users._id;
        } else {
          // Attempt to log in or register on the fly to get a valid UUID
          console.log('Rider profile not found in public.users, attempting to auto-resolve...');
          const { data: logInData } = await supabase.auth.signInWithPassword({
            email: rider.email,
            password: 'password123'
          }).catch(() => ({ data: null }));

          let sessionUser = logInData?.user;
          if (!sessionUser) {
            const { data: signUpData } = await supabase.auth.signUp({
              email: rider.email,
              password: 'password123',
              options: { data: { name: rider.name, role: 'rider' } }
            }).catch(() => ({ data: null }));
            sessionUser = signUpData?.user;
          }

          if (sessionUser) {
            riderId = sessionUser.id;
            await supabase.from('users').upsert({
              _id: riderId,
              email: rider.email,
              name: rider.name,
              role: 'rider',
              phone: editPhone
            }, { onConflict: '_id' });
          } else {
            // Last resort: deterministic fallback UUID
            const generatedUuid = 'd0d0d0d0-d0d0-d0d0-d0d0-' + rider.email.replace(/[^a-f0-9]/g, '').padEnd(12, '0').slice(0, 12);
            await supabase.from('users').upsert({
              _id: generatedUuid,
              email: rider.email,
              name: rider.name,
              role: 'rider',
              phone: editPhone
            }, { onConflict: '_id' });
            riderId = generatedUuid;
          }
        }
      }

      let existingCode = 'N/A';
      if (job.driver) {
        try {
          const parsed = typeof job.driver === 'string' ? JSON.parse(job.driver) : job.driver;
          existingCode = parsed.pickupCode || 'N/A';
        } catch (_) {}
      }

      const driverJSON = {
        name: rider.name,
        email: rider.email,
        avatar: rider.avatar,
        phone: editPhone,
        pickupCode: existingCode,
        location: { lat: 17.4520, lng: 78.3680, progress: 0, stage: 'to_store' }
      };

      const { data: success, error: rpcError } = await supabase.rpc('accept_delivery_job', {
        p_order_id: job._id,
        p_rider_id: riderId,
        p_driver_json: driverJSON
      });

      if (rpcError) throw rpcError;
      if (!success) throw new Error('This job was already accepted by another rider.');

      setActiveOrder({
        ...job,
        status: 'rider_assigned',
        orderStatus: 'rider_assigned',
        rider_id: riderId,
        driver: driverJSON,
      });
      
      setDeliveryStage('to_store');
      setProgress(0);
      setItemChecklist({});
      setOtpVerified(false);
      setEnteredOtp('');
      Alert.alert('Trip Accepted 🏍️', 'Navigation to restaurant started. Please arrive at merchant.');
    } catch (err: any) {
      Alert.alert('Error', 'Failed to accept order: ' + err.message);
    } finally {
      setUpdatingStatus(false);
    }
  };


  const handleRejectOrder = () => {
    if (alertTimerRef.current) clearInterval(alertTimerRef.current);
    setNewOrderAlert(null);
    Alert.alert('Order Declined', 'The offer has been rejected. Searching for more jobs.');
  };

  const handleIgnoreJob = (jobId: string) => {
    setIgnoredJobIds(prev => [...prev, jobId]);
    Alert.alert('Offer Ignored 🚫', 'This order offer has been ignored and removed from your dashboard.');
  };


  const handleArrivedAtStore = () => {
    setDeliveryStage('at_store');
  };

  const handleConfirmPickup = () => {
    // Check if checklist items are fully validated
    const activeItems = activeOrder?.items || [];
    const allChecked = activeItems.every((it: any) => itemChecklist[it.foodItem?._id || it.foodItem]);

    if (!allChecked && activeItems.length > 0) {
      Alert.alert('Verification Required', 'Please double-check and verify all food items with checkboxes before leaving the store.');
      return;
    }

    Alert.alert(
      'Pickup Confirmation',
      'Is the order picked?',
      [
        {
          text: 'No',
          style: 'cancel',
        },
        {
          text: 'Yes',
          onPress: async () => {
            setUpdatingStatus(true);
            try {
              const now = new Date().toISOString();
              const statusHistoryUpdate = [
                ...(activeOrder.statusHistory || []),
                { status: 'out_for_delivery', timestamp: now }
              ];

              let existingCode = 'N/A';
              if (activeOrder.driver) {
                try {
                  const parsed = typeof activeOrder.driver === 'string' ? JSON.parse(activeOrder.driver) : activeOrder.driver;
                  existingCode = parsed.pickupCode || 'N/A';
                } catch (_) {}
              }

              const driverJSON = JSON.stringify({
                name: rider.name,
                email: rider.email,
                avatar: rider.avatar,
                phone: editPhone,
                pickupCode: existingCode,
                location: { lat: 17.4483, lng: 78.3741, progress: 0, stage: 'to_customer' }
              });

              const { error } = await supabase
                .from('orders')
                .update({
                  orderStatus: 'out_for_delivery',
                  statusHistory: statusHistoryUpdate,
                  driver: driverJSON,
                  updatedAt: now
                })
                .eq('_id', activeOrder._id);

              if (error) throw error;

              setActiveOrder({
                ...activeOrder,
                orderStatus: 'out_for_delivery',
                statusHistory: statusHistoryUpdate,
                driver: driverJSON
              });
              setDeliveryStage('to_customer');
              setProgress(0);
            } catch (err: any) {
              Alert.alert('Error', 'Failed to update order status: ' + err.message);
            } finally {
              setUpdatingStatus(false);
            }
          }
        }
      ]
    );
  };


  const handleVerifyOtpCode = async () => {
    // Check if checklist items are fully validated
    const activeItems = activeOrder?.items || [];
    const allChecked = activeItems.every((it: any) => itemChecklist[it.foodItem?._id || it.foodItem]);

    if (!allChecked && activeItems.length > 0) {
      Alert.alert('Verification Required', 'Please check and verify all food items with checkboxes before entering the OTP.');
      return;
    }

    if (enteredOtp.length < 4) {
      Alert.alert('Invalid OTP', 'Please enter the 4-digit OTP shown on the merchant screen.');
      return;
    }

    setOtpVerifying(true);
    try {
      const { data: matched, error } = await supabase.rpc('verify_pickup_otp', {
        p_order_id: activeOrder._id,
        p_entered_otp: enteredOtp
      });
      if (error) throw error;

      setOtpVerified(true);
      Alert.alert('Success 🎉', 'OTP verified successfully! Please hand over food package and ask merchant to confirm pickup.');
    } catch (err: any) {
      Alert.alert('Verification Failed', err.message || 'Incorrect verification code. Please check and try again.');
    } finally {
      setOtpVerifying(false);
    }
  };

  const handleMarkDelivered = () => {
    if (!activeOrder) return;
    
    Alert.alert(
      'Delivery Confirmation',
      'Is the order delivered?',
      [
        {
          text: 'No',
          style: 'cancel',
        },
        {
          text: 'Yes',
          onPress: async () => {
            setUpdatingStatus(true);
            try {
              const { error } = await supabase.rpc('mark_order_delivered', { p_order_id: activeOrder._id });
              if (error) throw error;

              Alert.alert('Delivered! 🏆', 'Great job! ₹50 added to your wallet.');
              setActiveOrder(null);
              setWalletBalance(prev => prev + 50);
              setDeliveryStage('to_store');
              setProgress(0);
              fetchHistory();
            } catch (err: any) {
              Alert.alert('Error', 'Failed to complete delivery: ' + err.message);
            } finally {
              setUpdatingStatus(false);
            }
          }
        }
      ]
    );
  };

  const handleWithdrawWallet = () => {
    if (walletBalance <= 0) {
      Alert.alert('Empty Balance', 'No earnings available for withdrawal.');
      return;
    }
    setCashoutLoading(true);
    setTimeout(() => {
      setCashoutLoading(false);
      Alert.alert('Cashout Successful 💸', `₹${walletBalance} successfully transferred to your verified bank account.`);
      setWalletBalance(0);
    }, 1200);
  };

  const handleSaveProfile = () => {
    if (!editName.trim() || !editEmail.trim()) {
      Alert.alert('Error', 'Name and Email cannot be empty.');
      return;
    }
    setSavingProfile(true);
    setTimeout(() => {
      setSavingProfile(false);
      if (onUpdateRider) {
        onUpdateRider({
          ...rider,
          name: editName,
          email: editEmail,
          phone: editPhone
        });
        Alert.alert('Saved', 'Profile details updated.');
      }
    }, 600);
  };

  const handleSubmitTicket = () => {
    if (!ticketDesc.trim()) {
      Alert.alert('Details Required', 'Please explain the issue details to submit support tickets.');
      return;
    }
    setSubmittingTicket(true);
    setTimeout(() => {
      setSubmittingTicket(false);
      const newTicket = {
        id: Date.now(),
        category: ticketCategory,
        description: ticketDesc,
        status: 'Open',
        date: new Date().toLocaleDateString()
      };
      setSupportTickets([newTicket, ...supportTickets]);
      setTicketDesc('');
      Alert.alert('Ticket Raised 🎫', 'Our support center has received your request and will contact you shortly.');
    }, 1000);
  };

  // Helper coordinate mapper for SVG en-route map
  const getCoordinatesAlongPath = (progVal: number) => {
    const startX = 50;
    const startY = 140;
    const endX = 390;
    const endY = 60;
    const currentX = startX + (endX - startX) * progVal;
    const currentY = startY + (endY - startY) * progVal - Math.sin(progVal * Math.PI) * 45;
    return { x: currentX, y: currentY };
  };

  const currentPos = getCoordinatesAlongPath(progress);

  return (
    <View style={styles.container}>
      {/* --- RIDER HEADER SECTION --- */}
      <View style={styles.header}>
        {/* Top-Left: Profile avatar & details */}
        <View style={styles.headerProfile}>
          <View style={[styles.avatarBox, { backgroundColor: isOnline ? theme.colors.primaryGreen : theme.colors.secondaryText }]}>
            <Text style={styles.avatarText}>{rider.name.substring(0, 2).toUpperCase()}</Text>
          </View>
          <View style={{ gap: 1 }}>
            <Text style={styles.headerRiderName} numberOfLines={1}>{rider.name}</Text>
            <Text style={styles.headerRole}>VD-R{editPhone.slice(-4)}</Text>
          </View>
        </View>

        {/* Middle: Online/Offline Switcher */}
        <View style={styles.headerMiddleToggle}>
          <Text style={[styles.dutyStatusText, { color: isOnline ? theme.colors.primaryGreen : theme.colors.secondaryText }]}>
            {isOnline ? 'Online' : 'Offline'}
          </Text>
          <Switch
            value={isOnline}
            onValueChange={(val) => {
              setIsOnline(val);
              if (!val && activeOrder) {
                Alert.alert('Warning', 'You cannot go offline while on an active delivery job.');
                setIsOnline(true);
              }
            }}
            trackColor={{ false: theme.colors.border, true: '#86EFAC' }}
            thumbColor={isOnline ? theme.colors.primaryGreen : theme.colors.lightText}
          />
        </View>

        {/* Top-Right: Notifications */}
        <TouchableOpacity style={styles.notifBtn} onPress={() => setShowNotifications(!showNotifications)}>
          <BellIcon color={theme.colors.primaryText} />
          {notifications.length > 0 && <View style={styles.notifBadge} />}
        </TouchableOpacity>
      </View>

      {/* --- NOTIFICATIONS OVERLAY MODAL --- */}
      <Modal
        visible={showNotifications}
        transparent
        animationType="fade"
        onRequestClose={() => setShowNotifications(false)}
      >
        <View style={styles.notifOverlay}>
          <View style={styles.notifContent}>
            <View style={styles.notifHeader}>
              <Text style={styles.notifHeaderTitle}>Rider Notifications ({notifications.length})</Text>
              <TouchableOpacity onPress={() => setShowNotifications(false)}>
                <CloseIcon color="#0F172A" />
              </TouchableOpacity>
            </View>

            <ScrollView>
              {notifications.map(n => (
                <View key={n.id} style={styles.notifRow}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                    <Text style={styles.notifTitle}>{n.title}</Text>
                    <Text style={styles.notifTime}>{n.time}</Text>
                  </View>
                  <Text style={styles.notifBody}>{n.body}</Text>
                </View>
              ))}
              <TouchableOpacity style={styles.clearNotifsBtn} onPress={() => setNotifications([])}>
                <Text style={styles.clearNotifsText}>Dismiss All Notifications</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* --- AVAILABLE RIDER TABS VIEWER --- */}
      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        {/* ==================== TAB 1: DUTY / ACTIVE DELIVERY ==================== */}
        {activeTab === 'duty' && (
          <View>
            {/* Duty Summary Indicators */}
            <View style={styles.statsRow}>
              <View style={styles.statBox}>
                <Text style={styles.statLabel}>Today's Pay</Text>
                <Text style={styles.statValue}>₹{history.length * 50}</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statLabel}>Trips Completed</Text>
                <Text style={styles.statValue}>{history.length}</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statLabel}>Duty Hours</Text>
                <Text style={styles.statValue}>{isOnline ? '3.5h' : '0.0h'}</Text>
              </View>
            </View>

            {/* Active Delivery Flow Manager */}
            {activeOrder ? (
              <View style={[styles.card, { borderLeftWidth: 4, borderLeftColor: theme.colors.primaryGreen }]}>
                <View style={styles.activeOrderHeader}>
                  <Text style={styles.activeOrderTitle}>🏍️ ACTIVE DELIVERY TASK</Text>
                  <Text style={styles.activeOrderId}>ID: VD-{activeOrder._id.substring(18).toUpperCase()}</Text>
                </View>
                <View style={styles.divider} />

                {/* STAGE 1: Navigate to store */}
                {deliveryStage === 'to_store' && (
                  <View>
                    <View style={styles.locationRow}>
                      <View style={[styles.locationBullet, { backgroundColor: '#0A3B2E' }]} />
                      <View style={{ flex: 1 }}>
                        <Text style={styles.locationTitle}>Store Pickup Location</Text>
                        <Text style={styles.locationDetail}>{getRestaurantName(activeOrder.restaurant)} (Gachibowli)</Text>
                      </View>
                      <TouchableOpacity style={styles.circleCallBtn} onPress={() => Alert.alert('Call Merchant', 'Calling merchant restaurant hotline...')}>
                        <PhoneIcon color="#ffffff" />
                      </TouchableOpacity>
                    </View>

                    {/* Leaflet Map for Navigation to Restaurant */}
                    <View style={styles.trackingMap}>
                      <LeafletMap
                        restaurantLat={17.4483}
                        restaurantLng={78.3741}
                        customerLat={17.4435}
                        customerLng={78.3812}
                        riderLat={17.4520 + (17.4483 - 17.4520) * progress}
                        riderLng={78.3680 + (78.3741 - 78.3680) * progress}
                        stage="to_store"
                      />
                      <Text style={styles.navInstruction}>🧭 Route: Gachibowli Outer Ring Road ({getRestaurantDistance(activeOrder.restaurant)})</Text>
                    </View>


                    <TouchableOpacity style={styles.largePrimaryBtn} onPress={handleArrivedAtStore}>
                      <Text style={styles.largePrimaryBtnText}>I Have Arrived at Merchant Store</Text>
                    </TouchableOpacity>
                  </View>
                )}

                {/* STAGE 2: At store item verification checklist */}
                {deliveryStage === 'at_store' && (
                  <View>
                    <View style={styles.pickupCodeContainer}>
                       <Text style={styles.pickupCodeLabel}>MERCHANT VERIFICATION ID</Text>
                       <Text style={styles.pickupCodeVal}>
                         {(() => {
                           try {
                             const parsed = typeof activeOrder.driver === 'string' ? JSON.parse(activeOrder.driver) : activeOrder.driver;
                             return parsed?.pickupCode || 'N/A';
                           } catch (_) {
                             return 'N/A';
                           }
                         })()}
                       </Text>
                       <Text style={styles.pickupCodeSub}>Show this ID code to merchant to pick up the food package</Text>
                     </View>

                    <Text style={styles.instructionHeading}>Verify and Checklist Items before Pickup:</Text>
                    
                    {activeOrder.items && activeOrder.items.map((it: any, index: number) => {
                      const itemId = it.foodItem?._id || it.foodItem;
                      const isChecked = !!itemChecklist[itemId];
                      return (
                        <TouchableOpacity 
                          key={index} 
                          style={styles.checkItemRow}
                          onPress={() => setItemChecklist({ ...itemChecklist, [itemId]: !isChecked })}
                        >
                          <View style={[styles.checkBox, isChecked && styles.checkBoxChecked]}>
                            {isChecked && <Text style={{ color: '#fff', fontSize: 10, fontWeight: '900' }}>✓</Text>}
                          </View>
                          <Text style={styles.checkItemName}>
                            {it.foodItem?.name || 'Delicious Veg Dish'} <Text style={{ fontWeight: '800', color: theme.colors.primaryGreen }}>x{it.quantity}</Text>
                          </Text>
                        </TouchableOpacity>
                      );
                    })}

                    {(activeOrder.pickup_otp_verified || otpVerified) ? (
                      <View style={{ padding: 16, backgroundColor: theme.colors.softSuccessBg, borderRadius: 12, borderWidth: 1, borderColor: theme.colors.sageGreen, marginVertical: 12 }}>
                        <Text style={{ color: theme.colors.success, fontWeight: 'bold', textAlign: 'center', fontSize: 15 }}>
                          ✓ OTP Verified Successfully!
                        </Text>
                        <Text style={{ color: theme.colors.success, textAlign: 'center', fontSize: 13, marginTop: 4 }}>
                          Merchant is handing over the food package. Awaiting merchant confirmation...
                        </Text>
                      </View>
                    ) : (
                      <View style={{ marginVertical: 16 }}>
                        <Text style={styles.instructionHeading}>Enter 4-Digit Merchant OTP:</Text>
                        <TextInput
                          style={{
                            backgroundColor: '#F8FAFC',
                            borderWidth: 1,
                            borderColor: '#E2E8F0',
                            borderRadius: 12,
                            padding: 12,
                            color: '#0F172A',
                            fontSize: 24,
                            fontWeight: '600',
                            textAlign: 'center',
                            letterSpacing: 8,
                            height: 54,
                            marginBottom: 12
                          }}
                          placeholder="0000"
                          placeholderTextColor="#CBD5E1"
                          keyboardType="numeric"
                          maxLength={4}
                          value={enteredOtp}
                          onChangeText={setEnteredOtp}
                        />
                        <TouchableOpacity 
                          style={[styles.largePrimaryBtn, otpVerifying && styles.disabledBtn]} 
                          onPress={handleVerifyOtpCode}
                          disabled={otpVerifying}
                        >
                          {otpVerifying ? (
                            <ActivityIndicator color="#ffffff" />
                          ) : (
                            <Text style={styles.largePrimaryBtnText}>Verify Merchant OTP</Text>
                          )}
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                )}

                {/* STAGE 3: Navigate to customer & Live tracking */}
                {deliveryStage === 'to_customer' && (
                  <View>
                    <View style={styles.locationRow}>
                      <View style={[styles.locationBullet, { backgroundColor: theme.colors.gold }]} />
                      <View style={{ flex: 1 }}>
                        <Text style={styles.locationTitle}>Delivery Address</Text>
                        <Text style={styles.locationDetail}>{activeOrder.deliveryAddress?.street || 'Main Street'}, Gachibowli</Text>
                      </View>
                      <TouchableOpacity style={styles.circleCallBtn} onPress={() => Alert.alert('Call Customer', 'Calling customer phone number...')}>
                        <PhoneIcon color="#ffffff" />
                      </TouchableOpacity>
                    </View>

                    {/* Leaflet Map for Navigation to Customer */}
                    <View style={styles.trackingMap}>
                      <LeafletMap
                        restaurantLat={17.4483}
                        restaurantLng={78.3741}
                        customerLat={17.4435}
                        customerLng={78.3812}
                        riderLat={17.4483 + (17.4435 - 17.4483) * progress}
                        riderLng={78.3741 + (78.3812 - 78.3741) * progress}
                        stage="to_customer"
                      />
                      <Text style={styles.navInstruction}>📡 Live Tracking Broadcast (progress: {Math.round(progress * 100)}%)</Text>
                    </View>

                    <View style={styles.progressBarContainer}>
                      <View style={[styles.progressBarFill, { width: `${progress * 100}%` }]} />
                    </View>

                    <TouchableOpacity 
                      style={[styles.largePrimaryBtn, progress < 1.0 && styles.disabledBtn]} 
                      onPress={handleMarkDelivered}
                      disabled={progress < 1.0 || updatingStatus}
                    >
                      {updatingStatus ? (
                        <ActivityIndicator color="#ffffff" />
                      ) : (
                        <Text style={styles.largePrimaryBtnText}>
                          {progress < 1.0 ? 'Transit progress en route...' : 'Mark Order as Delivered'}
                        </Text>
                      )}
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            ) : (
              /* Available Pickups feed list */
              <View>
                <Text style={styles.sectionTitle}>Available Job Pickups ({availableJobs.length})</Text>
                
                {!isOnline ? (
                  <View style={styles.emptyCard}>
                    <Text style={[styles.emptyTitle, { color: '#EF4444' }]}>You are Offline</Text>
                    <Text style={styles.emptySubtitle}>Go Online in the top right to start receiving order offers.</Text>
                  </View>
                ) : jobsLoading ? (
                  <ActivityIndicator size="large" color={theme.colors.primaryGreen} style={{ margin: 40 }} />
                ) : availableJobs.length === 0 ? (
                  <View style={styles.emptyCard}>
                    <Text style={styles.emptyTitle}>No orders</Text>
                    <Text style={styles.emptySubtitle}>There are currently no orders ready for pickup.</Text>
                  </View>
                ) : (
                  availableJobs.map(job => (
                    <View key={job._id} style={styles.jobFeedCard}>
                      <View style={styles.jobFeedHeader}>
                        <Text style={styles.jobFeedId}>ID: VD-{job._id.substring(18).toUpperCase()}</Text>
                        <Text style={styles.jobFeedPayout}>₹50</Text>
                      </View>
                      <View style={styles.divider} />
                      <Text style={styles.jobFeedDetail}>Store: {getRestaurantName(job.restaurant)} ({getRestaurantDistance(job.restaurant)})</Text>
                      <Text style={styles.jobFeedDetail}>Dropoff: {job.deliveryAddress?.street || 'Gachibowli'}, {job.deliveryAddress?.city || 'Hyderabad'}</Text>
                      <View style={{ flexDirection: 'row', gap: 10, marginTop: 12 }}>
                        <TouchableOpacity style={[styles.jobFeedBtn, { flex: 1, backgroundColor: '#EF4444', height: 34, borderRadius: 8, justifyContent: 'center', alignItems: 'center' }]} onPress={() => handleIgnoreJob(job._id)}>
                          <Text style={{ fontSize: 12, color: '#FFFFFF', fontWeight: '700' }}>Ignore</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.jobFeedBtn, { flex: 2, backgroundColor: theme.colors.primaryGreen, height: 34, borderRadius: 8, justifyContent: 'center', alignItems: 'center' }]} onPress={() => handleAcceptOrder(job)}>
                          <Text style={{ fontSize: 12, color: '#FFFFFF', fontWeight: '700' }}>Accept Order</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))

                )}
              </View>
            )}
          </View>
        )}

        {/* ==================== TAB 2: FINANCE & INCENTIVES ==================== */}
        {activeTab === 'finance' && (
          <View>
            {/* Wallet Section */}
            <View style={[styles.card, { backgroundColor: theme.colors.darkGreen, borderWidth: 0 }]}>
              <Text style={styles.walletTitle}>VegDash Rider Wallet Balance</Text>
              <Text style={styles.walletVal}>₹{walletBalance}</Text>
              <Text style={styles.walletSub}>Verified Bank: State Bank of India (••••1234)</Text>
              
              <TouchableOpacity 
                style={styles.withdrawBtn} 
                onPress={handleWithdrawWallet}
                disabled={cashoutLoading || walletBalance === 0}
              >
                {cashoutLoading ? (
                  <ActivityIndicator color={theme.colors.primaryGreen} />
                ) : (
                  <Text style={styles.withdrawBtnText}>Withdraw Earnings to Bank</Text>
                )}
              </TouchableOpacity>
            </View>

            {/* Incentives progress milestones */}
            <Text style={styles.sectionTitle}>Incentives & Bonuses</Text>
            <View style={styles.card}>
              <View style={styles.incentiveHeader}>
                <Text style={styles.incentiveName}>Daily Target Incentive</Text>
                <Text style={styles.incentivePay}>+₹100 Bonus</Text>
              </View>
              <Text style={styles.incentiveDesc}>Complete 6 deliveries today to hit target payout.</Text>
              <View style={styles.progressBarContainer}>
                <View style={[styles.progressBarFill, { width: `${Math.min((history.length / 6) * 100, 100)}%` }]} />
              </View>
              <Text style={styles.incentiveProgressLabel}>Progress: {history.length}/6 orders</Text>
            </View>

            <View style={styles.card}>
              <View style={styles.incentiveHeader}>
                <Text style={styles.incentiveName}>Weekly Milestone Bonus</Text>
                <Text style={styles.incentivePay}>+₹500 Bonus</Text>
              </View>
              <Text style={styles.incentiveDesc}>Complete 30 deliveries this week.</Text>
              <View style={styles.progressBarContainer}>
                <View style={[styles.progressBarFill, { width: '73%', backgroundColor: theme.colors.gold }]} />
              </View>
              <Text style={styles.incentiveProgressLabel}>Progress: 22/30 orders</Text>
            </View>

            {/* Trip logs */}
            <Text style={styles.sectionTitle}>Trip Earning History</Text>
            {historyLoading ? (
              <ActivityIndicator size="small" color={theme.colors.primaryGreen} />
            ) : history.length === 0 ? (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyTitle}>No Completed Trips</Text>
                <Text style={styles.emptySubtitle}>Completed orders will log payout cash credits here.</Text>
              </View>
            ) : (
              history.map(item => (
                <View key={item._id} style={styles.historyCard}>
                  <View>
                    <Text style={styles.historyId}>VD-{item._id.substring(18).toUpperCase()}</Text>
                    <Text style={styles.historyDate}>
                      {new Date(item.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {new Date(item.updatedAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                    </Text>
                  </View>
                  <Text style={styles.historyEarning}>+₹50</Text>
                </View>
              ))
            )}
          </View>
        )}

        {/* ==================== TAB 3: RATINGS & PERFORMANCE ==================== */}
        {activeTab === 'performance' && (
          <View>
            <View style={styles.statsCardContainer}>
              <View style={styles.perfScoreCard}>
                <Text style={styles.perfScoreVal}>
                  {(() => {
                    const customerReviews = history
                      .map(o => {
                        try {
                          const parsed = typeof o.driver === 'string' ? JSON.parse(o.driver) : o.driver;
                          return parsed?.review ? parsed.review : null;
                        } catch (_) {
                          return null;
                        }
                      })
                      .filter(r => r !== null);
                    if (customerReviews.length === 0) return '4.8 ★';
                    const total = customerReviews.reduce((sum, r) => sum + r.rating, 0);
                    const avg = (total / customerReviews.length).toFixed(1);
                    return `${avg} ★`;
                  })()}
                </Text>
                <Text style={styles.perfScoreLabel}>Rider Rating</Text>
              </View>
              <View style={styles.perfScoreCard}>
                <Text style={[styles.perfScoreVal, { color: '#10B981' }]}>98%</Text>
                <Text style={styles.perfScoreLabel}>Acceptance Rate</Text>
              </View>
            </View>


            <View style={styles.statsCardContainer}>
              <View style={styles.perfScoreCard}>
                <Text style={[styles.perfScoreVal, { color: '#10B981' }]}>95%</Text>
                <Text style={styles.perfScoreLabel}>On-Time Rate</Text>
              </View>
              <View style={styles.perfScoreCard}>
                <Text style={[styles.perfScoreVal, { color: '#EF4444' }]}>2%</Text>
                <Text style={styles.perfScoreLabel}>Cancel Rate</Text>
              </View>
            </View>

            <Text style={styles.sectionTitle}>Customer Feedback Comments</Text>
            {(() => {
              const customerReviews = history
                .map(o => {
                  try {
                    const parsed = typeof o.driver === 'string' ? JSON.parse(o.driver) : o.driver;
                    return parsed?.review ? { ...parsed.review, orderId: o._id, updatedAt: o.updatedAt } : null;
                  } catch (_) {
                    return null;
                  }
                })
                .filter(r => r !== null);

              if (customerReviews.length === 0) {
                return (
                  <View>
                    <View style={styles.feedbackCard}>
                      <Text style={styles.feedbackRating}>⭐⭐⭐⭐⭐ 5/5</Text>
                      <Text style={styles.feedbackText}>"Delivered extremely fast and the food was hot. Friendly rider."</Text>
                      <Text style={styles.feedbackTime}>10 hours ago</Text>
                    </View>

                    <View style={styles.feedbackCard}>
                      <Text style={styles.feedbackRating}>⭐⭐⭐⭐⭐ 5/5</Text>
                      <Text style={styles.feedbackText}>"Polite behavior, followed delivery directions perfectly."</Text>
                      <Text style={styles.feedbackTime}>2 days ago</Text>
                    </View>
                  </View>
                );
              }

              return customerReviews.map((rev: any, index: number) => {
                const starsStr = '⭐'.repeat(rev.rating) + '☆'.repeat(5 - rev.rating);
                return (
                  <View key={index} style={styles.feedbackCard}>
                    <Text style={styles.feedbackRating}>{starsStr} {rev.rating}/5</Text>
                    <Text style={styles.feedbackText}>"{rev.comment || 'No comment provided'}"</Text>
                    <Text style={styles.feedbackTime}>
                      {new Date(rev.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                    </Text>
                  </View>
                );
              });
            })()}

          </View>
        )}

        {/* ==================== TAB 4: PORTAL (PROFILE, SUPPORT, SETTINGS) ==================== */}
        {activeTab === 'portal' && (
          <View>
            {/* PROFILE EDITOR */}
            <View style={styles.card}>
              <Text style={styles.cardHeaderTitle}>Edit Profile Info</Text>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Full Name</Text>
                <TextInput style={styles.textInput} value={editName} onChangeText={setEditName} />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Email Address</Text>
                <TextInput style={styles.textInput} value={editEmail} onChangeText={setEditEmail} autoCapitalize="none" />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Phone Number</Text>
                <TextInput style={styles.textInput} value={editPhone} onChangeText={setEditPhone} />
              </View>
              <TouchableOpacity style={styles.largePrimaryBtn} onPress={handleSaveProfile} disabled={savingProfile}>
                {savingProfile ? <ActivityIndicator color="#fff" /> : <Text style={styles.largePrimaryBtnText}>Save Profile Changes</Text>}
              </TouchableOpacity>
            </View>

            {/* KYC UPLOADED DOCUMENTS */}
            <TouchableOpacity style={styles.cardButton} onPress={() => setShowDocModal(true)}>
              <View style={{ flex: 1 }}>
                <Text style={styles.cardBtnTitle}>KYC Verification Documents</Text>
                <Text style={styles.cardBtnSub}>Aadhaar, Driving License, PAN Card</Text>
              </View>
              <Text style={styles.verifiedBadge}>All Verified</Text>
            </TouchableOpacity>

            {/* SUPPORT HELPDESK FAQ */}
            <Text style={styles.sectionTitle}>Support & Help Desk</Text>
            <View style={styles.card}>
              <Text style={styles.cardHeaderTitle}>Frequently Asked Questions</Text>
              
              {[
                { q: "How are weekly payouts calculated?", a: "Rider earnings accumulated from Monday to Sunday are processed and credited to your verified bank account by Tuesday morning." },
                { q: "What should I do if a store is closed?", a: "Go to support in the active order and upload a photo of the closed restaurant. Our helpline will verify and credit a cancel pay." },
                { q: "How to handle unreachable customers?", a: "Wait at the customer gate and call at least 3 times. If unanswered after a 10 min timer, raise a support ticket to return the food." }
              ].map((faq, index) => (
                <View key={index} style={styles.faqRow}>
                  <TouchableOpacity style={styles.faqQuestionRow} onPress={() => setFaqExpanded(faqExpanded === index ? null : index)}>
                    <Text style={styles.faqQuestion}>{faq.q}</Text>
                    <Text style={styles.faqToggleSymbol}>{faqExpanded === index ? '−' : '+'}</Text>
                  </TouchableOpacity>
                  {faqExpanded === index && (
                    <Text style={styles.faqAnswer}>{faq.a}</Text>
                  )}
                </View>
              ))}
            </View>

            {/* RAISE SUPPORT TICKET */}
            <View style={styles.card}>
              <Text style={styles.cardHeaderTitle}>Raise Help Ticket</Text>
              <Text style={[styles.cardBtnSub, { marginBottom: 12 }]}>If you have an issue, explain details to get call support</Text>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Choose Issue Category</Text>
                <View style={styles.categoryPickerRow}>
                  {['Payment Issue', 'App Glitch', 'Order Dispute'].map(cat => (
                    <TouchableOpacity 
                      key={cat} 
                      style={[styles.categoryBtn, ticketCategory === cat && styles.categoryBtnActive]}
                      onPress={() => setTicketCategory(cat)}
                    >
                      <Text style={[styles.categoryBtnText, ticketCategory === cat && styles.categoryBtnTextActive]}>{cat}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Issue Explanation Details</Text>
                <TextInput
                  style={[styles.textInput, { height: 80, textAlignVertical: 'top' }]}
                  multiline
                  placeholder="Explain your problem..."
                  placeholderTextColor="#94A3B8"
                  value={ticketDesc}
                  onChangeText={setTicketDesc}
                />
              </View>

              <TouchableOpacity style={styles.largePrimaryBtn} onPress={handleSubmitTicket} disabled={submittingTicket}>
                {submittingTicket ? <ActivityIndicator color="#fff" /> : <Text style={styles.largePrimaryBtnText}>Submit Support Ticket</Text>}
              </TouchableOpacity>

              {supportTickets.length > 0 && (
                <View style={{ marginTop: 20 }}>
                  <Text style={styles.supportHistoryTitle}>Active Support Tickets</Text>
                  {supportTickets.map(tk => (
                    <View key={tk.id} style={styles.ticketRow}>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                        <Text style={styles.ticketCategory}>{tk.category}</Text>
                        <Text style={styles.ticketStatus}>{tk.status}</Text>
                      </View>
                      <Text style={styles.ticketDesc}>{tk.description}</Text>
                      <Text style={styles.ticketDate}>{tk.date}</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>

            {/* SETTINGS PREFERENCES */}
            <View style={styles.card}>
              <Text style={styles.cardHeaderTitle}>App Settings & Preferences</Text>
              
              <View style={styles.settingPrefRow}>
                <Text style={styles.settingPrefLabel}>Voice Navigation Guidance</Text>
                <Switch value={prefSound} onValueChange={setPrefSound} trackColor={{ false: '#CBD5E1', true: 'rgba(11, 77, 58, 0.3)' }} thumbColor={prefSound ? theme.colors.primaryGreen : '#64748B'} />
              </View>

              <View style={styles.settingPrefRow}>
                <Text style={styles.settingPrefLabel}>Vibrate on Order Dispatch Alerts</Text>
                <Switch value={prefVib} onValueChange={setPrefVib} trackColor={{ false: '#CBD5E1', true: 'rgba(11, 77, 58, 0.3)' }} thumbColor={prefVib ? theme.colors.primaryGreen : '#64748B'} />
              </View>

              <View style={styles.settingPrefRow}>
                <Text style={styles.settingPrefLabel}>Rain Alert Mode Active</Text>
                <Switch value={prefRain} onValueChange={setPrefRain} trackColor={{ false: '#CBD5E1', true: 'rgba(11, 77, 58, 0.3)' }} thumbColor={prefRain ? theme.colors.primaryGreen : '#64748B'} />
              </View>

              <View style={styles.divider} />
              
              <TouchableOpacity style={styles.logoutBtn} onPress={onLogout}>
                <Text style={styles.logoutBtnText}>Log Out from Portal</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>

      {/* --- NEW ORDER OFFER ALERT POPUP OVERLAY --- */}
      {newOrderAlert && (
        <View style={styles.orderAlertOverlay}>
          <View style={styles.orderAlertCard}>
            <View style={styles.orderAlertFlashingBorder} />
            <Text style={styles.alertHeaderTitle}>🚨 NEW DELIVERY OFFER</Text>
            
            <View style={styles.alertTimerRing}>
              <Text style={styles.alertTimerText}>{alertCountdown}s</Text>
            </View>

            <Text style={styles.alertPayVal}>₹50.00</Text>
            <Text style={styles.alertPayLabel}>Estimated Order Payout</Text>

            <View style={styles.divider} />

            <View style={styles.alertDetailRow}>
              <Text style={styles.alertLabel}>Pickup Restaurant:</Text>
              <Text style={styles.alertValText}>Ishtaa Pure Veg (Gachibowli)</Text>
            </View>
            <View style={styles.alertDetailRow}>
              <Text style={styles.alertLabel}>Trip Distance:</Text>
              <Text style={styles.alertValText}>~1.8 km en route</Text>
            </View>
            <View style={styles.alertDetailRow}>
              <Text style={styles.alertLabel}>Customer Dropoff:</Text>
              <Text style={styles.alertValText}>{newOrderAlert.deliveryAddress?.street || 'Main Street'}, Gachibowli</Text>
            </View>

            <View style={styles.alertBtnRow}>
              <TouchableOpacity style={styles.alertRejectBtn} onPress={handleRejectOrder}>
                <Text style={styles.alertRejectBtnText}>Decline Offer</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.alertAcceptBtn} onPress={() => handleAcceptOrder(newOrderAlert)}>
                <Text style={styles.alertAcceptBtnText}>Accept Pickup</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {/* --- DOCUMENTS VIEWER MODAL --- */}
      <Modal
        visible={showDocModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowDocModal(false)}
      >
        <View style={styles.docModalOverlay}>
          <View style={styles.docModalContent}>
            <View style={styles.notifHeader}>
              <Text style={styles.notifHeaderTitle}>Rider Documents (KYC)</Text>
              <TouchableOpacity onPress={() => setShowDocModal(false)}>
                <CloseIcon color="#0F172A" />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={{ gap: 16, paddingVertical: 12 }}>
              <View style={styles.docItemCard}>
                <Text style={styles.docItemTitle}>Aadhaar Identity Card</Text>
                <Text style={styles.docItemStatus}>✓ Verified (Secure Storage)</Text>
                <Text style={styles.docItemLink} numberOfLines={1}>{rider.documents?.aadhaar || 'https://supabase.co/storage/v1/object/public/kyc-documents/kyc/aadhaar.jpg'}</Text>
              </View>

              <View style={styles.docItemCard}>
                <Text style={styles.docItemTitle}>Driving License</Text>
                <Text style={styles.docItemStatus}>✓ Verified (Secure Storage)</Text>
                <Text style={styles.docItemLink} numberOfLines={1}>{rider.documents?.dl || 'https://supabase.co/storage/v1/object/public/kyc-documents/kyc/dl.jpg'}</Text>
              </View>

              <View style={styles.docItemCard}>
                <Text style={styles.docItemTitle}>Permanent Account Number (PAN)</Text>
                <Text style={styles.docItemStatus}>✓ Verified (Secure Storage)</Text>
                <Text style={styles.docItemLink} numberOfLines={1}>{rider.documents?.pan || 'https://supabase.co/storage/v1/object/public/kyc-documents/kyc/pan.jpg'}</Text>
              </View>

              <View style={styles.docItemCard}>
                <Text style={styles.docItemTitle}>Vehicle details</Text>
                <Text style={styles.docItemStatus}>Type: {rider.documents?.vehicle || 'Motorcycle'}</Text>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* --- BOTTOM TAB BAR NAVIGATION --- */}
      <View style={styles.tabBar}>
        <TouchableOpacity 
          style={[styles.tabItem, activeTab === 'duty' && styles.tabItemActive]} 
          onPress={() => setActiveTab('duty')}
        >
          <DutyIcon color={activeTab === 'duty' ? theme.colors.primaryGreen : theme.colors.lightText} />
          <Text style={[styles.tabLabel, activeTab === 'duty' && styles.tabLabelActive]}>Duty</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.tabItem, activeTab === 'finance' && styles.tabItemActive]} 
          onPress={() => setActiveTab('finance')}
        >
          <FinanceIcon color={activeTab === 'finance' ? theme.colors.primaryGreen : theme.colors.lightText} />
          <Text style={[styles.tabLabel, activeTab === 'finance' && styles.tabLabelActive]}>Finance</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.tabItem, activeTab === 'performance' && styles.tabItemActive]} 
          onPress={() => setActiveTab('performance')}
        >
          <StarIcon color={activeTab === 'performance' ? theme.colors.primaryGreen : theme.colors.lightText} />
          <Text style={[styles.tabLabel, activeTab === 'performance' && styles.tabLabelActive]}>Ratings</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.tabItem, activeTab === 'portal' && styles.tabItemActive]} 
          onPress={() => setActiveTab('portal')}
        >
          <PortalIcon color={activeTab === 'portal' ? theme.colors.primaryGreen : theme.colors.lightText} />
          <Text style={[styles.tabLabel, activeTab === 'portal' && styles.tabLabelActive]}>Portal</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  
  // Header styles
  header: { paddingHorizontal: 16, paddingVertical: 14, backgroundColor: theme.colors.card, borderBottomWidth: 1, borderBottomColor: theme.colors.border, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', shadowColor: theme.colors.primaryGreen, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.02, shadowRadius: 4, elevation: 1 },
  headerProfile: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  avatarBox: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  avatarText: { color: '#ffffff', fontWeight: '800', fontSize: 13, fontFamily: 'Outfit' },
  headerRiderName: { fontSize: 15, fontWeight: '800', color: theme.colors.primaryText, fontFamily: 'Outfit', maxWidth: 130 },
  headerRole: { fontSize: 11, color: theme.colors.secondaryText, fontWeight: '600' },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  notifBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: theme.colors.warmWhite, justifyContent: 'center', alignItems: 'center', position: 'relative' },
  notifBadge: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#EF4444', position: 'absolute', top: 6, right: 6, borderWidth: 1.5, borderColor: theme.colors.card },
  dutySwitchContainer: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dutyStatusText: { fontSize: 12, fontWeight: '700' },

  scrollContent: { padding: 16, paddingBottom: 85 },
  divider: { height: 1, backgroundColor: theme.colors.border, marginVertical: 14 },

  // Stats boxes
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  statBox: { flex: 1, backgroundColor: theme.colors.card, borderWidth: 1, borderColor: theme.colors.border, padding: 12, borderRadius: 14, alignItems: 'center' },
  statLabel: { fontSize: 11, color: theme.colors.secondaryText, fontWeight: '600', marginBottom: 4 },
  statValue: { fontSize: 18, fontWeight: '800', color: theme.colors.primaryText, fontFamily: 'Outfit' },

  // Card general
  card: { backgroundColor: theme.colors.card, borderWidth: 1, borderColor: theme.colors.border, borderRadius: 16, padding: 16, marginBottom: 16, shadowColor: theme.colors.primaryGreen, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.01, shadowRadius: 3, elevation: 1 },
  cardHeaderTitle: { fontSize: 15, fontWeight: '800', color: theme.colors.primaryText, marginBottom: 14, fontFamily: 'Outfit' },
  largePrimaryBtn: { backgroundColor: theme.colors.primaryGreen, height: 44, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginTop: 16 },
  largePrimaryBtnText: { color: '#ffffff', fontWeight: '700', fontSize: 13 },
  disabledBtn: { backgroundColor: '#CBD5E1' },

  // Active Order details
  activeOrderHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  activeOrderTitle: { fontSize: 13, fontWeight: '800', color: theme.colors.primaryGreen, letterSpacing: 0.5 },
  activeOrderId: { fontSize: 11, fontWeight: '600', color: theme.colors.secondaryText },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginVertical: 8 },
  locationBullet: { width: 10, height: 10, borderRadius: 5 },
  locationTitle: { fontSize: 12, fontWeight: '700', color: theme.colors.secondaryText },
  locationDetail: { fontSize: 14, fontWeight: '800', color: theme.colors.primaryText },
  circleCallBtn: { width: 34, height: 34, borderRadius: 17, backgroundColor: theme.colors.primaryGreen, justifyContent: 'center', alignItems: 'center' },

  // SVG Tracking map
  trackingMap: { height: 180, backgroundColor: theme.colors.background, borderRadius: 12, borderWidth: 1, borderColor: theme.colors.border, marginVertical: 14, overflow: 'hidden', position: 'relative' },
  mapGrid: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, opacity: 0.04, borderWidth: 1, borderColor: '#475569' },
  mapBadge: { position: 'absolute', backgroundColor: 'rgba(15, 23, 42, 0.85)', paddingHorizontal: 6, paddingVertical: 3, borderRadius: 4 },
  mapBadgeText: { color: '#ffffff', fontSize: 8, fontWeight: '700' },
  navInstruction: { position: 'absolute', bottom: 8, left: 8, right: 8, backgroundColor: theme.colors.card, padding: 6, borderRadius: 6, fontSize: 10, fontWeight: '700', color: theme.colors.secondaryText, textAlign: 'center', borderWidth: 1, borderColor: theme.colors.border },
  progressBarContainer: { height: 6, backgroundColor: theme.colors.warmWhite, borderRadius: 3, marginVertical: 10, overflow: 'hidden' },
  progressBarFill: { height: '100%', backgroundColor: theme.colors.primaryGreen, borderRadius: 3 },

  // Verification checklist
  instructionHeading: { fontSize: 12, fontWeight: '700', color: theme.colors.secondaryText, marginBottom: 12 },
  checkItemRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: theme.colors.border },
  checkBox: { width: 18, height: 18, borderWidth: 2, borderColor: theme.colors.primaryGreen, borderRadius: 4, justifyContent: 'center', alignItems: 'center' },
  checkBoxChecked: { backgroundColor: theme.colors.primaryGreen },
  checkItemName: { fontSize: 13, fontWeight: '700', color: theme.colors.primaryText },

  // Available jobs feed
  sectionTitle: { fontSize: 13, fontWeight: '800', color: theme.colors.secondaryText, textTransform: 'uppercase', marginBottom: 12, letterSpacing: 0.5 },
  emptyCard: { backgroundColor: theme.colors.card, borderWidth: 1, borderColor: theme.colors.border, borderRadius: 16, padding: 32, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  emptyTitle: { fontSize: 15, fontWeight: '800', color: theme.colors.secondaryText, marginBottom: 4 },
  emptySubtitle: { fontSize: 12, color: theme.colors.lightText, textAlign: 'center', lineHeight: 18 },
  pulseRadar: { width: 12, height: 12, borderRadius: 6, backgroundColor: theme.colors.primaryGreen, marginVertical: 8 },
  jobFeedCard: { backgroundColor: theme.colors.card, borderWidth: 1, borderColor: theme.colors.border, borderRadius: 16, padding: 14, marginBottom: 12 },
  jobFeedHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  jobFeedId: { fontSize: 13, fontWeight: '800', color: theme.colors.primaryText },
  jobFeedPayout: { fontSize: 16, fontWeight: '900', color: theme.colors.primaryGreen },
  jobFeedDetail: { fontSize: 12, color: theme.colors.secondaryText, marginTop: 4 },
  jobFeedBtn: { backgroundColor: 'rgba(11, 77, 58, 0.08)', height: 34, borderRadius: 8, justifyContent: 'center', alignItems: 'center', marginTop: 10 },
  jobFeedBtnText: { fontSize: 12, color: theme.colors.primaryGreen, fontWeight: '700' },

  // Wallet
  walletTitle: { color: 'rgba(255, 255, 255, 0.8)', fontSize: 12, fontWeight: '600', marginBottom: 4 },
  walletVal: { color: '#FFFFFF', fontSize: 32, fontWeight: '900', marginBottom: 12 },
  walletSub: { color: 'rgba(255, 255, 255, 0.8)', fontSize: 11, marginBottom: 16 },
  withdrawBtn: { backgroundColor: '#FFFFFF', height: 42, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  withdrawBtnText: { color: theme.colors.primaryGreen, fontWeight: '800', fontSize: 13 },

  // Incentives
  incentiveName: { fontSize: 13, fontWeight: '700', color: theme.colors.primaryText },
  incentivePay: { fontSize: 13, fontWeight: '800', color: theme.colors.primaryGreen },
  incentiveDesc: { fontSize: 11, color: theme.colors.secondaryText, marginTop: 2, marginBottom: 8 },
  incentiveProgressLabel: { fontSize: 10, color: theme.colors.lightText, fontWeight: '700', marginTop: 4 },
  incentiveHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },

  // Trip history logs
  historyCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 12, borderBottomWidth: 1, borderBottomColor: theme.colors.border, backgroundColor: theme.colors.card, borderRadius: 12, borderWidth: 1, borderColor: theme.colors.border, marginBottom: 8 },
  historyId: { fontSize: 12, fontWeight: '700', color: theme.colors.primaryText },
  historyDate: { fontSize: 10, color: theme.colors.secondaryText, marginTop: 2 },
  historyEarning: { fontSize: 13, fontWeight: '800', color: theme.colors.success },

  // Performance Tab
  statsCardContainer: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  perfScoreCard: { flex: 1, backgroundColor: theme.colors.card, borderWidth: 1, borderColor: theme.colors.border, borderRadius: 16, padding: 16, alignItems: 'center' },
  perfScoreVal: { fontSize: 24, fontWeight: '900', color: theme.colors.primaryGreen, marginBottom: 4 },
  perfScoreLabel: { fontSize: 11, color: theme.colors.secondaryText, fontWeight: '700' },
  feedbackCard: { backgroundColor: theme.colors.card, borderWidth: 1, borderColor: theme.colors.border, borderRadius: 14, padding: 14, marginBottom: 10 },
  feedbackRating: { fontSize: 12, marginBottom: 6 },
  feedbackText: { fontSize: 12, color: theme.colors.primaryText, fontStyle: 'italic', lineHeight: 18 },
  feedbackTime: { fontSize: 9, color: theme.colors.lightText, marginTop: 6, textAlign: 'right' },

  // Portal Tab Profile Editor
  inputGroup: { marginBottom: 12 },
  inputLabel: { fontSize: 11, fontWeight: '700', color: theme.colors.secondaryText, marginBottom: 4 },
  textInput: { backgroundColor: theme.colors.card, borderWidth: 1, borderColor: theme.colors.border, borderRadius: 10, padding: 10, color: theme.colors.primaryText, fontSize: 13, fontWeight: '500' },
  cardButton: { flexDirection: 'row', backgroundColor: theme.colors.card, borderWidth: 1, borderColor: theme.colors.border, borderRadius: 14, padding: 14, alignItems: 'center', marginBottom: 16 },
  cardBtnTitle: { fontSize: 14, fontWeight: '700', color: theme.colors.primaryText },
  cardBtnSub: { fontSize: 11, color: theme.colors.secondaryText, marginTop: 2 },
  verifiedBadge: { fontSize: 10, color: theme.colors.success, backgroundColor: theme.colors.softSuccessBg, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, fontWeight: '700' },
  
  // Support ticket list & settings
  faqRow: { borderBottomWidth: 1, borderBottomColor: theme.colors.border, paddingVertical: 10 },
  faqQuestionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  faqQuestion: { fontSize: 13, fontWeight: '700', color: theme.colors.primaryText, flex: 1 },
  faqToggleSymbol: { fontSize: 15, fontWeight: '700', color: theme.colors.secondaryText },
  faqAnswer: { fontSize: 12, color: theme.colors.secondaryText, marginTop: 6, lineHeight: 18 },
  categoryPickerRow: { flexDirection: 'row', gap: 6, marginTop: 4 },
  categoryBtn: { flex: 1, backgroundColor: theme.colors.warmWhite, borderWidth: 1, borderColor: theme.colors.border, paddingVertical: 8, borderRadius: 8, alignItems: 'center' },
  categoryBtnActive: { backgroundColor: 'rgba(11, 77, 58, 0.08)', borderColor: theme.colors.primaryGreen },
  categoryBtnText: { fontSize: 10, fontWeight: '700', color: theme.colors.secondaryText },
  categoryBtnTextActive: { color: theme.colors.primaryGreen },
  supportHistoryTitle: { fontSize: 12, fontWeight: '800', color: theme.colors.secondaryText, marginBottom: 10, textTransform: 'uppercase' },
  ticketRow: { backgroundColor: theme.colors.warmWhite, borderWidth: 1, borderColor: theme.colors.border, padding: 10, borderRadius: 8, marginBottom: 8 },
  ticketCategory: { fontSize: 11, fontWeight: '700', color: theme.colors.primaryText },
  ticketStatus: { fontSize: 9, color: theme.colors.primaryGreen, backgroundColor: 'rgba(11, 77, 58, 0.08)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, fontWeight: '700' },
  ticketDesc: { fontSize: 11, color: theme.colors.secondaryText, marginTop: 4 },
  ticketDate: { fontSize: 9, color: theme.colors.lightText, marginTop: 6, textAlign: 'right' },
  settingPrefRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12 },
  settingPrefLabel: { fontSize: 13, fontWeight: '700', color: theme.colors.primaryText },
  logoutBtn: { borderWidth: 1, borderColor: 'rgba(239, 68, 68, 0.2)', backgroundColor: 'rgba(239, 68, 68, 0.04)', height: 42, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  logoutBtnText: { color: '#EF4444', fontWeight: '800', fontSize: 13 },

  // Offer alert overlay flashing card
  orderAlertOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(15, 23, 42, 0.6)', justifyContent: 'center', alignItems: 'center', padding: 20, zIndex: 100 },
  orderAlertCard: { width: '100%', maxWidth: 380, backgroundColor: theme.colors.card, padding: 20, borderRadius: 24, borderWidth: 3, borderColor: '#FF9800', alignItems: 'center', position: 'relative', overflow: 'hidden' },
  orderAlertFlashingBorder: { position: 'absolute', top: 0, left: 0, right: 0, height: 6, backgroundColor: '#FF9800' },
  alertHeaderTitle: { fontSize: 13, fontWeight: '800', color: '#FF9800', marginBottom: 16, textTransform: 'uppercase', letterSpacing: 1 },
  alertTimerRing: { width: 50, height: 50, borderRadius: 25, borderWidth: 3, borderColor: '#FF9800', justifyContent: 'center', alignItems: 'center', marginBottom: 14 },
  alertTimerText: { fontSize: 15, fontWeight: '900', color: '#FF9800' },
  alertPayVal: { fontSize: 32, fontWeight: '900', color: theme.colors.primaryGreen },
  alertPayLabel: { fontSize: 11, color: theme.colors.secondaryText, fontWeight: '700', marginBottom: 16 },
  alertDetailRow: { width: '100%', flexDirection: 'row', justifyContent: 'space-between', marginVertical: 6 },
  alertLabel: { fontSize: 12, fontWeight: '700', color: theme.colors.secondaryText },
  alertValText: { fontSize: 12, fontWeight: '800', color: theme.colors.primaryText, flex: 1, textAlign: 'right', marginLeft: 10 },
  alertBtnRow: { flexDirection: 'row', gap: 12, width: '100%', marginTop: 24 },
  alertRejectBtn: { flex: 1, borderWidth: 1, borderColor: theme.colors.border, height: 44, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  alertRejectBtnText: { color: theme.colors.secondaryText, fontWeight: '700', fontSize: 13 },
  alertAcceptBtn: { flex: 2, backgroundColor: theme.colors.primaryGreen, height: 44, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  alertAcceptBtnText: { color: '#ffffff', fontWeight: '700', fontSize: 13 },

  // Bottom navigation tab bar
  tabBar: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 58, backgroundColor: theme.colors.card, borderTopWidth: 1, borderTopColor: theme.colors.border, flexDirection: 'row', shadowColor: theme.colors.primaryGreen, shadowOffset: { width: 0, height: -2 }, shadowOpacity: 0.02, shadowRadius: 4, elevation: 10 },
  tabItem: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 4 },
  tabItemActive: { borderTopWidth: 3, borderTopColor: theme.colors.primaryGreen },
  tabLabel: { fontSize: 10, fontWeight: '700', color: theme.colors.lightText },
  tabLabelActive: { color: theme.colors.primaryGreen },

  // Document modal viewer
  docModalOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.4)', justifyContent: 'flex-end' },
  docModalContent: { backgroundColor: theme.colors.card, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingBottom: 40, maxHeight: '80%' },
  docItemCard: { backgroundColor: theme.colors.warmWhite, borderWidth: 1, borderColor: theme.colors.border, borderRadius: 12, padding: 14 },
  docItemTitle: { fontSize: 13, fontWeight: '800', color: theme.colors.primaryText },
  docItemStatus: { fontSize: 10, color: theme.colors.success, fontWeight: '700', marginTop: 4 },
  docItemLink: { fontSize: 10, color: theme.colors.lightText, marginTop: 6 },
  notifOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.4)', justifyContent: 'flex-end' },
  notifContent: { backgroundColor: theme.colors.card, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingBottom: 30, maxHeight: '70%' },
  notifHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  notifHeaderTitle: { fontSize: 15, fontWeight: '800', color: theme.colors.primaryText },
  notifRow: { padding: 12, borderBottomWidth: 1, borderBottomColor: theme.colors.border },
  notifTitle: { fontSize: 13, fontWeight: '800', color: theme.colors.primaryText },
  notifTime: { fontSize: 10, color: theme.colors.lightText },
  notifBody: { fontSize: 12, color: theme.colors.secondaryText, marginTop: 4, lineHeight: 16 },
  clearNotifsBtn: { padding: 12, alignItems: 'center', marginTop: 8 },
  clearNotifsText: { color: theme.colors.secondaryText, fontSize: 12, fontWeight: '600' },
  headerMiddleToggle: { flexDirection: 'row', alignItems: 'center', gap: 4, justifyContent: 'center', flex: 1.5 },
  pickupCodeContainer: { backgroundColor: 'rgba(255, 152, 0, 0.05)', borderWidth: 1, borderColor: 'rgba(255, 152, 0, 0.3)', padding: 14, borderRadius: 12, alignItems: 'center', marginBottom: 16 },
  pickupCodeLabel: { fontSize: 9, fontWeight: '800', color: '#FF9800', letterSpacing: 1, marginBottom: 4 },
  pickupCodeVal: { fontSize: 24, fontWeight: '900', color: theme.colors.primaryText, letterSpacing: 2 },
  pickupCodeSub: { fontSize: 10, color: theme.colors.secondaryText, marginTop: 4, textAlign: 'center' }
});
