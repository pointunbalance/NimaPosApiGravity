import React, { useEffect, useRef } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { useToast } from '../context/ToastContext';

export const SystemNotifications: React.FC = () => {
    const { success, warning } = useToast();
    
    // Store already notified IDs to prevent duplicate alerts
    const notifiedReadyOrders = useRef<Set<number>>(new Set());
    const notifiedLowStock = useRef<Set<number>>(new Set());
    const initialOrdersLoaded = useRef(false);
    const initialProductsLoaded = useRef(false);

    const readyOrders = useLiveQuery(
        () => db.orders.where('fulfillmentStatus').equals('ready').toArray(),
        []
    );

    const products = useLiveQuery(
        () => db.products.toArray(),
        []
    );

    useEffect(() => {
        if (!readyOrders) return;

        if (!initialOrdersLoaded.current) {
            readyOrders.forEach(order => {
                if (order.id) notifiedReadyOrders.current.add(order.id);
            });
            initialOrdersLoaded.current = true;
            return;
        }

        readyOrders.forEach(order => {
            if (order.id && !notifiedReadyOrders.current.has(order.id)) {
                // New ready order!
                notifiedReadyOrders.current.add(order.id);
                
                // Play sound
                playReadySound();

                // Show toast
                success(`الطلب رقم #${order.referenceNumber || order.id} جاهز للاستلام من المطبخ!`);
            }
        });
    }, [readyOrders, success]);

    useEffect(() => {
        if (!products) return;

        if (!initialProductsLoaded.current) {
             products.forEach(product => {
                if (product.id && product.alertThreshold !== undefined && product.stock <= product.alertThreshold) {
                    notifiedLowStock.current.add(product.id);
                }
            });
            initialProductsLoaded.current = true;
            return;
        }

        products.forEach(product => {
            if (product.id && product.alertThreshold !== undefined && product.stock <= product.alertThreshold) {
                if (!notifiedLowStock.current.has(product.id)) {
                    notifiedLowStock.current.add(product.id);
                    
                    // Play alert sound for stock (optional, or use same, or no sound)
                    // playAlertSound();
                    
                    warning(`تنبيه مخزون: الصنف "${product.name}" وصل للحد الأدنى (${product.stock})`);
                }
            } else if (product.id && product.alertThreshold !== undefined && product.stock > product.alertThreshold) {
                // If stock goes back up, remove from notified set so we can alert again later if it drops
                notifiedLowStock.current.delete(product.id);
            }
        });
    }, [products, warning]);

    const playReadySound = () => {
        try {
            // A simple beep sound using AudioContext
            const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
            const oscillator = audioCtx.createOscillator();
            const gainNode = audioCtx.createGain();
            
            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(880, audioCtx.currentTime); // A5
            oscillator.frequency.exponentialRampToValueAtTime(1760, audioCtx.currentTime + 0.1); // A6
            
            gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
            gainNode.gain.linearRampToValueAtTime(0.5, audioCtx.currentTime + 0.05);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5);
            
            oscillator.connect(gainNode);
            gainNode.connect(audioCtx.destination);
            
            oscillator.start();
            oscillator.stop(audioCtx.currentTime + 0.5);
        } catch (e) {
            console.error("Audio playback failed", e);
        }
    };

    return null; // This is a logic-only component
};
