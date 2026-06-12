'use client';
import { useEffect, useState, useRef } from 'react';
import { auth, db } from '@/lib/firebase';
import { 
    collection, doc, addDoc, deleteDoc, 
    onSnapshot, serverTimestamp, query, orderBy, limit 
} from 'firebase/firestore';
import { 
    IoImagesOutline, IoTrashOutline, IoChevronBackOutline, 
    IoChevronForwardOutline, IoCloseOutline, IoAddOutline, 
    IoLogoYoutube, IoShareOutline, IoDownloadOutline, IoPlay,
    IoPlayOutline, IoPauseOutline, IoAddCircleOutline, IoRemoveCircleOutline
} from 'react-icons/io5';

const DEFAULT_CATS = [
    { id: 'all', label: 'Tất cả' },
    { id: 'sieu-am', label: 'Siêu âm' },
    { id: 'don-thuoc', label: 'Đơn thuốc' },
    { id: 'khac', label: 'Khác' }
];

const DOMAIN = 'https://baby.appsviet.com';

export default function AlbumPage() {
    const [user, setUser] = useState<any>(null);
    const [activeTab, setActiveTab] = useState<'photo' | 'video'>('photo');
    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    
    // Photos state
    const [allPhotos, setAllPhotos] = useState<any[]>([]);
    const [filteredPhotos, setFilteredPhotos] = useState<any[]>([]);
    
    // Videos state
    const [allVideos, setAllVideos] = useState<any[]>([]);
    const [videoPage, setVideoPage] = useState<number>(1);
    const videoItemsPerPage = 6; // 6 items per page fits grid better

    // Upload Photo Modal state
    const [uploadModalOpen, setUploadModalOpen] = useState(false);
    const [previewImage, setPreviewImage] = useState<string>('');
    const [uploadCategory, setUploadCategory] = useState<string>('sieu-am');
    const [uploadNote, setUploadNote] = useState<string>('');
    const [takenDate, setTakenDate] = useState<Date | null>(null);
    const [isSavingPhoto, setIsSavingPhoto] = useState(false);

    // Lightbox state
    const [lightboxOpen, setLightboxOpen] = useState(false);
    const [currentPhotoIndex, setCurrentPhotoIndex] = useState<number>(-1);
    const [showControls, setShowControls] = useState(true);

    // Zoom & Pan state
    const [zoomScale, setZoomScale] = useState(1);
    const [zoomPos, setZoomPos] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);

    // Slideshow state
    const [isPlaying, setIsPlaying] = useState(false);

    // Add Video Modal state
    const [videoModalOpen, setVideoModalOpen] = useState(false);
    const [videoUrl, setVideoUrl] = useState<string>('');
    const [isSavingVideo, setIsSavingVideo] = useState(false);

    // Youtube Player Modal state
    const [ytPlayerOpen, setYtPlayerOpen] = useState(false);
    const [activeYtId, setActiveYtId] = useState<string>('');

    const fileInputRef = useRef<HTMLInputElement>(null);
    const dragStart = useRef({ x: 0, y: 0 });
    const touchStartX = useRef(0);
    const touchEndX = useRef(0);
    const controlsTimer = useRef<any>(null);
    const slideshowTimer = useRef<any>(null);
    const thumbnailsContainerRef = useRef<HTMLDivElement>(null);


    // Load auth and data listeners
    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged((currentUser) => {
            if (currentUser) {
                setUser(currentUser);
                
                // Realtime listen to photos
                const qPhotos = query(
                    collection(db, "users", currentUser.uid, "photos"), 
                    orderBy("createdAt", "desc"),
                    limit(120)
                );
                const unsubPhotos = onSnapshot(qPhotos, (snapshot) => {
                    const list = snapshot.docs.map(d => {
                        const data = d.data();
                        let sortDate = new Date();
                        if (data.takenAt) {
                            sortDate = data.takenAt.toDate ? data.takenAt.toDate() : new Date(data.takenAt);
                        } else if (data.createdAt) {
                            sortDate = data.createdAt.toDate ? data.createdAt.toDate() : new Date(data.createdAt);
                        }
                        return { id: d.id, ...data, sortDate };
                    });
                    setAllPhotos(list);
                });

                // Realtime listen to videos
                const qVideos = query(
                    collection(db, "users", currentUser.uid, "videos"),
                    orderBy("createdAt", "desc"),
                    limit(60)
                );
                const unsubVideos = onSnapshot(qVideos, (snapshot) => {
                    const list = snapshot.docs.map(d => {
                        const data = d.data();
                        let dateVal = new Date();
                        if (data.createdAt) {
                            dateVal = data.createdAt.toDate ? data.createdAt.toDate() : new Date(data.createdAt);
                        }
                        return { id: d.id, ...data, sortDate: dateVal };
                    });
                    setAllVideos(list);
                });

                return () => {
                    unsubPhotos();
                    unsubVideos();
                };
            }
        });
        return () => unsubscribe();
    }, []);

    // Filter photos
    useEffect(() => {
        let list = [...allPhotos];
        if (selectedCategory !== 'all') {
            list = list.filter(p => p.category === selectedCategory);
        }
        list.sort((a, b) => b.sortDate.getTime() - a.sortDate.getTime());
        setFilteredPhotos(list);
    }, [allPhotos, selectedCategory]);

    // Handle FAB click
    const handleFabClick = () => {
        if (activeTab === 'photo') {
            fileInputRef.current?.click();
        } else {
            setVideoUrl('');
            setVideoModalOpen(true);
        }
    };

    // Process image file selection
    const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setUploadNote('');
        setPreviewImage('');
        setUploadCategory('sieu-am');
        setTakenDate(file.lastModified ? new Date(file.lastModified) : new Date());

        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (e: any) => {
            const img = new Image();
            img.src = e.target.result;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                let width = img.width;
                let height = img.height;
                const MAX_DIM = 1080;
                
                if (width > MAX_DIM || height > MAX_DIM) {
                    if (width > height) {
                        height *= MAX_DIM / width;
                        width = MAX_DIM;
                    } else {
                        width *= MAX_DIM / height;
                        height = MAX_DIM;
                    }
                }
                
                canvas.width = width;
                canvas.height = height;
                ctx?.drawImage(img, 0, 0, width, height);

                let quality = 0.8;
                let dataUrl = canvas.toDataURL('image/jpeg', quality);
                // Keep compressing if file size is too big (>200KB Base64 character length is ~270,000)
                while (dataUrl.length > 270000 && quality > 0.3) {
                    quality -= 0.1;
                    dataUrl = canvas.toDataURL('image/jpeg', quality);
                }

                setPreviewImage(dataUrl);
                setUploadModalOpen(true);
            };
        };
        
        // Reset file input value to allow selecting the same file again
        event.target.value = '';
    };

    // Save photo to Firestore
    const saveImage = async () => {
        if (!user || !previewImage) return;
        setIsSavingPhoto(true);

        try {
            await addDoc(collection(db, "users", user.uid, "photos"), {
                image: previewImage,
                category: uploadCategory,
                note: uploadNote,
                takenAt: takenDate || new Date(),
                createdAt: serverTimestamp()
            });
            setUploadModalOpen(false);
        } catch (err: any) {
            alert("Lỗi: " + err.message);
        } finally {
            setIsSavingPhoto(false);
        }
    };

    // YouTube ID Extractor
    const extractYouTubeId = (url: string) => {
        let videoId: string | null = null;
        try {
            const urlObj = new URL(url);
            if (urlObj.hostname.includes('youtube.com')) {
                if (urlObj.pathname.startsWith('/shorts/')) {
                    videoId = urlObj.pathname.split('/')[2];
                } else if (urlObj.searchParams.has('v')) {
                    videoId = urlObj.searchParams.get('v');
                } else if (urlObj.pathname.startsWith('/embed/')) {
                    videoId = urlObj.pathname.split('/')[2];
                } else if (urlObj.pathname.startsWith('/v/')) {
                    videoId = urlObj.pathname.split('/')[2];
                }
            } else if (urlObj.hostname.includes('youtu.be')) {
                videoId = urlObj.pathname.substring(1);
            }
        } catch (e) {
            const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=|shorts\/)([^#\&\?]*).*/;
            const match = url.match(regExp);
            if (match && match[2].length === 11) videoId = match[2];
        }
        return (videoId && videoId.length === 11) ? videoId : null;
    };

    // Get YouTube title helper
    const fetchYouTubeTitle = async (url: string) => {
        try {
            const res = await fetch(`https://noembed.com/embed?url=${encodeURIComponent(url)}`);
            const data = await res.json();
            return data.title || "Video YouTube";
        } catch (e) {
            return "Video YouTube";
        }
    };

    // Save Video
    const saveVideo = async () => {
        if (!user) return;
        const videoId = extractYouTubeId(videoUrl);
        if (!videoId) {
            alert('Đường dẫn YouTube không hợp lệ!');
            return;
        }

        setIsSavingVideo(true);
        try {
            const autoTitle = await fetchYouTubeTitle(videoUrl);
            await addDoc(collection(db, "users", user.uid, "videos"), {
                youtubeId: videoId,
                url: videoUrl,
                note: autoTitle,
                createdAt: serverTimestamp()
            });
            setVideoModalOpen(false);
            setVideoUrl('');
        } catch (err: any) {
            alert('Lỗi: ' + err.message);
        } finally {
            setIsSavingVideo(false);
        }
    };

    // Delete photo
    const deletePhoto = async (photoId: string) => {
        if (!user) return;
        if (confirm("Bạn có chắc chắn muốn xóa bức ảnh này vĩnh viễn?")) {
            try {
                await deleteDoc(doc(db, "users", user.uid, "photos", photoId));
                setLightboxOpen(false);
            } catch (err: any) {
                alert("Lỗi khi xóa: " + err.message);
            }
        }
    };

    // Delete video
    const deleteVideo = async (videoId: string) => {
        if (!user) return;
        if (confirm("Bạn có chắc chắn muốn xóa video này?")) {
            try {
                await deleteDoc(doc(db, "users", user.uid, "videos", videoId));
            } catch (err: any) {
                alert("Lỗi khi xóa: " + err.message);
            }
        }
    };

    // Share photo link
    const sharePhoto = (photoId: string) => {
        navigator.clipboard.writeText(`${DOMAIN}/share.html?photo=${photoId}`).then(() => {
            alert("Đã sao chép link chia sẻ!");
        }).catch(() => {
            alert("Không thể sao chép tự động.");
        });
    };

    // Download photo (Base64 data url download)
    const downloadPhoto = (photo: any) => {
        const link = document.createElement("a");
        link.href = photo.image;
        link.download = `thaikypro_${photo.id}.jpg`;
        link.click();
    };

    // Lightbox navigation
    const navigateLightbox = (direction: number) => {
        setCurrentPhotoIndex(prev => {
            const newIndex = prev + direction;
            if (newIndex >= 0 && newIndex < filteredPhotos.length) {
                return newIndex;
            }
            return prev;
        });
    };

    // Auto-hide controls timer
    const resetControlsTimer = () => {
        setShowControls(true);
        if (controlsTimer.current) clearTimeout(controlsTimer.current);
        controlsTimer.current = setTimeout(() => {
            setShowControls(false);
        }, 3000);
    };

    // Keyboard navigation (ESC, ArrowLeft, ArrowRight)
    useEffect(() => {
        if (!lightboxOpen) return;
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'ArrowLeft') {
                navigateLightbox(-1);
            } else if (e.key === 'ArrowRight') {
                navigateLightbox(1);
            } else if (e.key === 'Escape') {
                setLightboxOpen(false);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [lightboxOpen, filteredPhotos]);

    // Slideshow interval runner
    useEffect(() => {
        if (isPlaying && lightboxOpen && filteredPhotos.length > 0) {
            slideshowTimer.current = setInterval(() => {
                setCurrentPhotoIndex(prev => {
                    if (prev < filteredPhotos.length - 1) {
                        return prev + 1;
                    }
                    return 0; // Loop back
                });
            }, 3000);
        } else {
            if (slideshowTimer.current) clearInterval(slideshowTimer.current);
        }
        return () => {
            if (slideshowTimer.current) clearInterval(slideshowTimer.current);
        };
    }, [isPlaying, lightboxOpen, filteredPhotos]);

    // Auto-hide handler hooks
    useEffect(() => {
        if (lightboxOpen) {
            resetControlsTimer();
        } else {
            setShowControls(true);
            setIsPlaying(false);
            handleResetZoom();
        }
        return () => {
            if (controlsTimer.current) clearTimeout(controlsTimer.current);
        };
    }, [lightboxOpen]);

    // Zoom & Pan Actions
    const handleZoomIn = () => setZoomScale(prev => Math.min(prev + 0.5, 3));
    const handleZoomOut = () => {
        setZoomScale(prev => {
            const next = Math.max(prev - 0.5, 1);
            if (next === 1) setZoomPos({ x: 0, y: 0 });
            return next;
        });
    };
    const handleResetZoom = () => {
        setZoomScale(1);
        setZoomPos({ x: 0, y: 0 });
    };

    // Reset zoom when image changes
    useEffect(() => {
        handleResetZoom();
    }, [currentPhotoIndex]);

    // Pan interactions
    const handleDragStart = (clientX: number, clientY: number) => {
        if (zoomScale === 1) return;
        setIsDragging(true);
        dragStart.current = { x: clientX - zoomPos.x, y: clientY - zoomPos.y };
    };

    const handleDragMove = (clientX: number, clientY: number) => {
        if (!isDragging || zoomScale === 1) return;
        setZoomPos({
            x: clientX - dragStart.current.x,
            y: clientY - dragStart.current.y
        });
    };

    const handleDragEnd = () => setIsDragging(false);

    // Mouse handlers
    const handleMouseDown = (e: React.MouseEvent) => {
        e.preventDefault();
        handleDragStart(e.clientX, e.clientY);
    };
    const handleMouseMove = (e: React.MouseEvent) => {
        handleDragMove(e.clientX, e.clientY);
    };
    const handleMouseUp = () => handleDragEnd();

    // Mobile touch gestures & Pan
    const handleTouchStartPan = (e: React.TouchEvent) => {
        resetControlsTimer();
        if (zoomScale > 1) {
            handleDragStart(e.targetTouches[0].clientX, e.targetTouches[0].clientY);
        } else {
            touchStartX.current = e.targetTouches[0].clientX;
            touchEndX.current = e.targetTouches[0].clientX;
        }
    };
    const handleTouchMovePan = (e: React.TouchEvent) => {
        if (zoomScale > 1 && isDragging) {
            handleDragMove(e.targetTouches[0].clientX, e.targetTouches[0].clientY);
        } else {
            touchEndX.current = e.targetTouches[0].clientX;
        }
    };
    const handleTouchEndPan = () => {
        if (zoomScale > 1) {
            handleDragEnd();
        } else {
            const diffX = touchStartX.current - touchEndX.current;
            if (diffX > 60) {
                navigateLightbox(1);
            } else if (diffX < -60) {
                navigateLightbox(-1);
            }
        }
    };

    const handleDoubleClick = () => {
        if (zoomScale > 1) {
            handleResetZoom();
        } else {
            setZoomScale(2);
            setZoomPos({ x: 0, y: 0 });
        }
    };

    // Auto scroll thumbnails
    useEffect(() => {
        if (lightboxOpen && thumbnailsContainerRef.current && currentPhotoIndex !== -1) {
            const container = thumbnailsContainerRef.current;
            const activeThumb = container.children[currentPhotoIndex] as HTMLElement;
            if (activeThumb) {
                const containerWidth = container.clientWidth;
                const thumbWidth = activeThumb.clientWidth;
                const thumbLeft = activeThumb.offsetLeft;
                container.scrollTo({
                    left: thumbLeft - containerWidth / 2 + thumbWidth / 2,
                    behavior: 'smooth'
                });
            }
        }
    }, [currentPhotoIndex, lightboxOpen]);

    // Group photos by date
    const groupPhotosByDate = () => {
        const groups: { [key: string]: { dateObj: Date; items: any[] } } = {};
        
        filteredPhotos.forEach(photo => {
            const date = photo.sortDate;
            const dateKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
            if (!groups[dateKey]) {
                groups[dateKey] = { dateObj: date, items: [] };
            }
            groups[dateKey].items.push(photo);
        });

        return Object.keys(groups)
            .sort((a, b) => b.localeCompare(a))
            .map(key => groups[key]);
    };

    // Format date string
    const formatDateFriendly = (date: Date) => {
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        
        if (date.toDateString() === today.toDateString()) return "Hôm nay";
        if (date.toDateString() === yesterday.toDateString()) return "Hôm qua";
        
        const m = date.getMonth() + 1;
        const y = date.getFullYear() !== today.getFullYear() ? ` ${date.getFullYear()}` : '';
        return `${date.getDate()} tháng ${m}${y}`;
    };

    // Videos pagination
    const totalVideoPages = Math.ceil(allVideos.length / videoItemsPerPage);
    const paginatedVideos = allVideos.slice(
        (videoPage - 1) * videoItemsPerPage,
        videoPage * videoItemsPerPage
    );

    return (
        <>
            <div className="utility-page-container fade-in">
            {/* Header Title and Tab Switcher */}
            <div className="album-header card" style={{ background: 'rgba(255, 255, 255, 0.7)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.5)' }}>
                <h2 style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--primary)', marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <IoImagesOutline style={{ fontSize: '2rem' }} /> Album Kỷ Niệm
                </h2>
                
                {/* Tab switch */}
                <div style={{ display: 'flex', background: '#f1f5f9', borderRadius: '14px', padding: '4px', marginBottom: '10px' }}>
                    <button 
                        onClick={() => setActiveTab('photo')} 
                        className={`tab-toggle ${activeTab === 'photo' ? 'active' : ''}`}
                    >
                        Hình Ảnh
                    </button>
                    <button 
                        onClick={() => setActiveTab('video')} 
                        className={`tab-toggle ${activeTab === 'video' ? 'active' : ''}`}
                    >
                        Video
                    </button>
                </div>
            </div>

            {/* Filter Chips for Photo Tab */}
            {activeTab === 'photo' && (
                <div className="chip-container" style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '10px', marginBottom: '15px' }}>
                    {DEFAULT_CATS.map(c => (
                        <button 
                            key={c.id}
                            onClick={() => setSelectedCategory(c.id)}
                            className={`chip-btn ${selectedCategory === c.id ? 'active' : ''}`}
                        >
                            {c.label}
                        </button>
                    ))}
                </div>
            )}

            {/* CONTENT AREA: PHOTOS */}
            {activeTab === 'photo' && (
                <div className="photo-gallery-content">
                    {filteredPhotos.length === 0 ? (
                        <div className="card text-center" style={{ padding: '60px 20px', background: 'rgba(255,255,255,0.7)', border: '1px solid rgba(255,255,255,0.4)', borderRadius: '24px' }}>
                            <IoImagesOutline style={{ fontSize: '4rem', color: '#cbd5e1', marginBottom: '15px' }} />
                            <h3 style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '5px' }}>Không có hình ảnh</h3>
                            <p style={{ color: 'var(--text-sub)', fontSize: '0.9rem' }}>Nhấn nút + góc dưới để thêm những bức ảnh siêu âm, đơn thuốc làm kỷ niệm.</p>
                        </div>
                    ) : (
                        groupPhotosByDate().map((group, groupIdx) => (
                            <div key={groupIdx} style={{ marginBottom: '25px' }}>
                                <div style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <span>{formatDateFriendly(group.dateObj)}</span>
                                    <span style={{ fontSize: '0.8rem', fontWeight: 500, color: 'var(--text-sub)' }}>{group.items.length} ảnh</span>
                                </div>
                                <div className="photo-grid">
                                    {group.items.map((photo) => {
                                        // Find absolute index in filteredPhotos for lightbox navigation
                                        const absIndex = filteredPhotos.findIndex(p => p.id === photo.id);
                                        return (
                                            <div 
                                                key={photo.id} 
                                                className="photo-cell" 
                                                onClick={() => {
                                                    setCurrentPhotoIndex(absIndex);
                                                    setLightboxOpen(true);
                                                }}
                                            >
                                                <img src={photo.image} alt={photo.note || 'Album Item'} loading="lazy" />
                                                {photo.note && (
                                                    <div className="photo-note-overlay">
                                                        <span>{photo.note}</span>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}

            {/* CONTENT AREA: VIDEOS */}
            {activeTab === 'video' && (
                <div className="video-gallery-content">
                    {allVideos.length === 0 ? (
                        <div className="card text-center" style={{ padding: '60px 20px', background: 'rgba(255,255,255,0.7)', border: '1px solid rgba(255,255,255,0.4)', borderRadius: '24px' }}>
                            <IoLogoYoutube style={{ fontSize: '4rem', color: '#cbd5e1', marginBottom: '15px' }} />
                            <h3 style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '5px' }}>Chưa có Video</h3>
                            <p style={{ color: 'var(--text-sub)', fontSize: '0.9rem' }}>Lưu lại các video Thai giáo, kiến thức mẹ bầu yêu thích từ YouTube.</p>
                        </div>
                    ) : (
                        <>
                            <div className="video-grid">
                                {paginatedVideos.map((video) => (
                                    <div key={video.id} className="video-cell">
                                        <div className="video-header-info">
                                            <div style={{ flex: 1, paddingRight: '10px' }}>
                                                <h4 className="video-title" title={video.note || 'Video YouTube'}>
                                                    {video.note || 'Video YouTube'}
                                                </h4>
                                                <span style={{ fontSize: '0.75rem', color: 'var(--text-sub)' }}>
                                                    {video.sortDate.toLocaleDateString('vi-VN')}
                                                </span>
                                            </div>
                                            <button 
                                                className="delete-video-btn" 
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    deleteVideo(video.id);
                                                }}
                                            >
                                                <IoTrashOutline />
                                            </button>
                                        </div>
                                        <div 
                                            className="video-thumb-container"
                                            onClick={() => {
                                                setActiveYtId(video.youtubeId);
                                                setYtPlayerOpen(true);
                                            }}
                                        >
                                            <img 
                                                src={`https://img.youtube.com/vi/${video.youtubeId}/hqdefault.jpg`} 
                                                alt="Thumbnail" 
                                                loading="lazy"
                                            />
                                            <div className="play-icon-overlay">
                                                <IoPlay style={{ fontSize: '1.8rem', color: 'white', marginLeft: '4px' }} />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            
                            {/* Video Pagination */}
                            {totalVideoPages > 1 && (
                                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginTop: '25px', gap: '8px' }}>
                                    <button 
                                        disabled={videoPage === 1}
                                        onClick={() => setVideoPage(prev => prev - 1)}
                                        className="pagination-arrow-btn"
                                    >
                                        <IoChevronBackOutline />
                                    </button>
                                    <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-main)' }}>
                                        Trang {videoPage} / {totalVideoPages}
                                    </span>
                                    <button 
                                        disabled={videoPage === totalVideoPages}
                                        onClick={() => setVideoPage(prev => prev + 1)}
                                        className="pagination-arrow-btn"
                                    >
                                        <IoChevronForwardOutline />
                                    </button>
                                </div>
                            )}
                        </>
                    )}
                </div>
            )}

            </div>

            {/* FLOATING ACTION BUTTON - Placed outside main container to fix viewport positioning */}
            <div style={{ position: 'fixed', bottom: '30px', right: '30px', zIndex: 1100 }}>
                <button className="fab-btn" onClick={handleFabClick}>
                    <IoAddOutline style={{ fontSize: '2.2rem' }} />
                </button>
            </div>

            {/* Hidden File Input for uploading photo */}
            <input 
                type="file" 
                ref={fileInputRef} 
                accept="image/*" 
                style={{ display: 'none' }} 
                onChange={handleFileSelect}
            />

            {/* UPLOAD PHOTO MODAL */}
            {uploadModalOpen && (
                <div className="bottom-modal-overlay">
                    <div className="bottom-modal-sheet">
                        <div className="modal-drag-handle"></div>
                        <h3 className="modal-sheet-title">Thêm ảnh mới</h3>
                        
                        <div className="image-preview-container">
                            <img src={previewImage} alt="Preview" />
                        </div>
                        
                        <div style={{ marginBottom: '15px' }}>
                            <label className="input-field-label">Chủ đề ảnh</label>
                            <select 
                                value={uploadCategory} 
                                onChange={(e) => setUploadCategory(e.target.value)}
                                className="styled-modal-select"
                            >
                                {DEFAULT_CATS.filter(c => c.id !== 'all').map(c => (
                                    <option key={c.id} value={c.id}>{c.label}</option>
                                ))}
                            </select>
                        </div>

                        <div style={{ marginBottom: '20px' }}>
                            <label className="input-field-label">Ghi chú kỷ niệm</label>
                            <input 
                                type="text" 
                                value={uploadNote} 
                                onChange={(e) => setUploadNote(e.target.value)}
                                placeholder="Ghi lại cảm xúc hoặc thông tin..."
                                className="styled-modal-input"
                            />
                        </div>

                        <div style={{ display: 'flex', gap: '12px' }}>
                            <button 
                                onClick={() => setUploadModalOpen(false)} 
                                className="modal-btn cancel-btn"
                                disabled={isSavingPhoto}
                            >
                                Hủy
                            </button>
                            <button 
                                onClick={saveImage} 
                                className="modal-btn submit-btn"
                                disabled={isSavingPhoto}
                            >
                                {isSavingPhoto ? "Đang lưu..." : "Lưu ảnh"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ADD VIDEO MODAL */}
            {videoModalOpen && (
                <div className="bottom-modal-overlay">
                    <div className="bottom-modal-sheet">
                        <div className="modal-drag-handle"></div>
                        <h3 className="modal-sheet-title">Thêm Video YouTube</h3>
                        
                        <div style={{ marginBottom: '20px' }}>
                            <label className="input-field-label">Đường dẫn YouTube</label>
                            <input 
                                type="url" 
                                value={videoUrl} 
                                onChange={(e) => setVideoUrl(e.target.value)}
                                placeholder="Dán link YouTube (VD: https://youtu.be/...)"
                                className="styled-modal-input"
                            />
                            <p style={{ fontSize: '0.8rem', color: 'var(--text-sub)', marginTop: '8px', textAlign: 'center' }}>
                                Tiêu đề video sẽ được tự động đồng bộ từ YouTube.
                            </p>
                        </div>

                        <div style={{ display: 'flex', gap: '12px' }}>
                            <button 
                                onClick={() => setVideoModalOpen(false)} 
                                className="modal-btn cancel-btn"
                                disabled={isSavingVideo}
                            >
                                Hủy
                            </button>
                            <button 
                                onClick={saveVideo} 
                                className="modal-btn submit-btn"
                                disabled={isSavingVideo}
                            >
                                {isSavingVideo ? "Đang tải..." : "Thêm Video"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* PHOTO LIGHTBOX VIEWER */}
            {lightboxOpen && currentPhotoIndex !== -1 && filteredPhotos[currentPhotoIndex] && (
                <div 
                    className="lightbox-overlay" 
                    onClick={() => setLightboxOpen(false)}
                    onMouseMove={resetControlsTimer}
                    onTouchStart={resetControlsTimer}
                >
                    {/* Top bar controls */}
                    <div 
                        className="lightbox-top-bar" 
                        style={{ 
                            transform: showControls ? 'translateY(0)' : 'translateY(-100%)', 
                            opacity: showControls ? 1 : 0 
                        }} 
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <button className="close-lightbox-btn" onClick={() => setLightboxOpen(false)}>
                                <IoCloseOutline />
                            </button>
                            <div className="lightbox-badge">
                                {DEFAULT_CATS.find(c => c.id === filteredPhotos[currentPhotoIndex].category)?.label || filteredPhotos[currentPhotoIndex].category}
                            </div>
                        </div>
                        
                        {/* Play/Pause & Zoom Controls */}
                        <div className="lightbox-view-controls">
                            <button 
                                className={`lightbox-control-action-btn ${isPlaying ? 'playing' : ''}`}
                                onClick={() => setIsPlaying(!isPlaying)}
                                title={isPlaying ? "Tạm dừng trình chiếu" : "Bắt đầu trình chiếu"}
                            >
                                {isPlaying ? <IoPauseOutline /> : <IoPlayOutline />}
                            </button>
                            <button 
                                className="lightbox-control-action-btn"
                                onClick={handleZoomOut}
                                disabled={zoomScale === 1}
                                title="Thu nhỏ"
                            >
                                <IoRemoveCircleOutline />
                            </button>
                            <span className="zoom-text">
                                {zoomScale.toFixed(1)}x
                            </span>
                            <button 
                                className="lightbox-control-action-btn"
                                onClick={handleZoomIn}
                                disabled={zoomScale === 3}
                                title="Phóng to"
                            >
                                <IoAddCircleOutline />
                            </button>
                        </div>
                    </div>

                    {/* Navigation controls */}
                    {showControls && zoomScale === 1 && currentPhotoIndex > 0 && (
                        <button 
                            className="lightbox-nav-btn prev-btn" 
                            onClick={(e) => { e.stopPropagation(); navigateLightbox(-1); }}
                        >
                            <IoChevronBackOutline />
                        </button>
                    )}
                    {showControls && zoomScale === 1 && currentPhotoIndex < filteredPhotos.length - 1 && (
                        <button 
                            className="lightbox-nav-btn next-btn" 
                            onClick={(e) => { e.stopPropagation(); navigateLightbox(1); }}
                        >
                            <IoChevronForwardOutline />
                        </button>
                    )}

                    {/* Central Image container */}
                    <div 
                        className="lightbox-image-container" 
                        onClick={(e) => e.stopPropagation()}
                        onTouchStart={handleTouchStartPan}
                        onTouchMove={handleTouchMovePan}
                        onTouchEnd={handleTouchEndPan}
                        onMouseDown={handleMouseDown}
                        onMouseMove={handleMouseMove}
                        onMouseUp={handleMouseUp}
                        onMouseLeave={handleDragEnd}
                        onDoubleClick={handleDoubleClick}
                    >
                        <img 
                            src={filteredPhotos[currentPhotoIndex].image} 
                            alt={filteredPhotos[currentPhotoIndex].note || 'Lightbox View'} 
                            style={{
                                transform: `translate(${zoomPos.x}px, ${zoomPos.y}px) scale(${zoomScale})`,
                                transition: isDragging ? 'none' : 'transform 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                                cursor: zoomScale > 1 ? (isDragging ? 'grabbing' : 'grab') : 'zoom-in'
                            }}
                            draggable="false"
                        />
                    </div>

                    {/* Bottom information and tools wrapper */}
                    <div 
                        className="lightbox-bottom-container" 
                        style={{ 
                            transform: showControls ? 'translateY(0)' : 'translateY(100%)', 
                            opacity: showControls ? 1 : 0 
                        }} 
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div style={{ textAlign: 'center', marginBottom: '8px' }}>
                            <div style={{ fontSize: '0.8rem', color: '#cbd5e1', marginBottom: '4px' }}>
                                {filteredPhotos[currentPhotoIndex].sortDate.toLocaleString('vi-VN')}
                            </div>
                            <div style={{ fontSize: '1rem', fontWeight: 600, color: 'white' }}>
                                {filteredPhotos[currentPhotoIndex].note || "Không có ghi chú"}
                            </div>
                        </div>

                        {/* Centralized tool action bar */}
                        <div className="lightbox-tools">
                            <button onClick={() => sharePhoto(filteredPhotos[currentPhotoIndex].id)} className="tool-action-btn">
                                <IoShareOutline style={{ fontSize: '1.4rem' }} />
                                <span>Chia sẻ</span>
                            </button>
                            <button onClick={() => downloadPhoto(filteredPhotos[currentPhotoIndex])} className="tool-action-btn">
                                <IoDownloadOutline style={{ fontSize: '1.4rem' }} />
                                <span>Tải về</span>
                            </button>
                            <button 
                                onClick={() => deletePhoto(filteredPhotos[currentPhotoIndex].id)} 
                                className="tool-action-btn danger-tool"
                            >
                                <IoTrashOutline style={{ fontSize: '1.4rem' }} />
                                <span>Xóa vĩnh viễn</span>
                            </button>
                        </div>

                        {/* Thumbnails strip */}
                        <div className="lightbox-thumbnails-strip" ref={thumbnailsContainerRef}>
                            {filteredPhotos.map((photo, index) => (
                                <div 
                                    key={photo.id}
                                    className={`lightbox-thumbnail-item ${index === currentPhotoIndex ? 'active' : ''}`}
                                    onClick={() => {
                                        setCurrentPhotoIndex(index);
                                        setIsPlaying(false);
                                    }}
                                >
                                    <img src={photo.image} alt="Thumb" />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* YOUTUBE IFRAME PLAYER MODAL */}
            {ytPlayerOpen && activeYtId && (
                <div className="lightbox-overlay" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <button 
                        className="close-lightbox-btn" 
                        style={{ position: 'absolute', top: '20px', right: '20px', zIndex: 3000, background: 'rgba(0,0,0,0.5)', padding: '10px' }}
                        onClick={() => {
                            setYtPlayerOpen(false);
                            setActiveYtId('');
                        }}
                    >
                        <IoCloseOutline style={{ fontSize: '1.8rem' }} />
                    </button>
                    <div style={{ width: '90%', maxWidth: '800px', aspectRatio: '16/9', background: '#000', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)' }} onClick={(e) => e.stopPropagation()}>
                        <iframe 
                            width="100%" 
                            height="100%" 
                            src={`https://www.youtube.com/embed/${activeYtId}?autoplay=1`} 
                            frameBorder="0" 
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                            allowFullScreen
                        ></iframe>
                    </div>
                </div>
            )}

            {/* Styles */}
            <style jsx global>{`
                @media (max-width: 600px) {
                    .album-header {
                        padding-top: 56px !important;
                    }
                    :global(.utility-page-container) {
                        padding-top: 16px !important;
                    }
                }

                .tab-toggle {
                    flex: 1;
                    padding: 10px 0;
                    text-align: center;
                    border: none;
                    background: transparent;
                    color: var(--text-sub);
                    font-size: 0.9rem;
                    font-weight: 700;
                    border-radius: 10px;
                    transition: all 0.25s ease;
                }
                .tab-toggle.active {
                    background: white;
                    color: var(--primary);
                    box-shadow: 0 4px 10px rgba(0,0,0,0.05);
                }
                .chip-btn {
                    white-space: nowrap;
                    padding: 8px 16px;
                    border-radius: 20px;
                    border: 1px solid rgba(13, 148, 136, 0.15);
                    background: rgba(255, 255, 255, 0.6);
                    color: var(--text-sub);
                    font-size: 0.85rem;
                    font-weight: 600;
                    transition: all 0.2s ease;
                }
                .chip-btn.active {
                    background: var(--primary);
                    color: white;
                    border-color: var(--primary);
                    box-shadow: 0 4px 12px rgba(13, 148, 136, 0.25);
                }
                .photo-grid {
                    display: grid;
                    grid-template-columns: repeat(3, 1fr);
                    gap: 8px;
                }
                @media (max-width: 576px) {
                    .photo-grid {
                        grid-template-columns: repeat(2, 1fr);
                        gap: 6px;
                    }
                }
                .photo-cell {
                    aspect-ratio: 1 / 1;
                    background: #f1f5f9;
                    border-radius: 12px;
                    overflow: hidden;
                    position: relative;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.03);
                    cursor: pointer;
                    transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.25s ease;
                }
                .photo-cell:hover {
                    transform: scale(1.02);
                    box-shadow: 0 8px 20px rgba(0,0,0,0.08);
                }
                .photo-cell img {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                }
                .photo-note-overlay {
                    position: absolute;
                    bottom: 0;
                    left: 0;
                    right: 0;
                    background: linear-gradient(transparent, rgba(0,0,0,0.6));
                    color: white;
                    padding: 8px;
                    font-size: 0.75rem;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }
                .video-grid {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 16px;
                }
                @media (max-width: 768px) {
                    .video-grid {
                        grid-template-columns: 1fr;
                        gap: 12px;
                    }
                }
                .video-cell {
                    background: rgba(255, 255, 255, 0.6);
                    backdrop-filter: blur(12px);
                    border: 1px solid rgba(255,255,255,0.4);
                    border-radius: 16px;
                    overflow: hidden;
                    box-shadow: var(--shadow-soft);
                    display: flex;
                    flex-direction: column;
                }
                .video-header-info {
                    padding: 12px 16px;
                    display: flex;
                    align-items: flex-start;
                    justify-content: space-between;
                }
                .video-title {
                    font-size: 0.88rem;
                    font-weight: 700;
                    color: var(--text-main);
                    margin: 0 0 4px 0;
                    display: -webkit-box;
                    -webkit-line-clamp: 2;
                    -webkit-box-orient: vertical;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    line-height: 1.35;
                }
                .delete-video-btn {
                    background: transparent;
                    border: none;
                    color: #ef4444;
                    font-size: 1.25rem;
                    padding: 4px;
                    border-radius: 6px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: background 0.2s;
                }
                .delete-video-btn:hover {
                    background: #fef2f2;
                }
                .video-thumb-container {
                    position: relative;
                    width: 100%;
                    aspect-ratio: 16 / 9;
                    background: #000;
                    cursor: pointer;
                    overflow: hidden;
                }
                .video-thumb-container img {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                    opacity: 0.85;
                    transition: all 0.3s ease;
                }
                .video-thumb-container:hover img {
                    transform: scale(1.04);
                    opacity: 1;
                }
                .play-icon-overlay {
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    width: 48px;
                    height: 48px;
                    background: rgba(239, 68, 68, 0.9);
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    box-shadow: 0 8px 20px rgba(239, 68, 68, 0.4);
                }
                .fab-btn {
                    width: 60px;
                    height: 60px;
                    border-radius: 20px;
                    background: linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%);
                    color: white;
                    border: none;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    box-shadow: 0 10px 25px rgba(13, 148, 136, 0.4);
                    cursor: pointer;
                    transition: transform 0.2s ease, box-shadow 0.2s;
                }
                .fab-btn:active {
                    transform: scale(0.95);
                    box-shadow: 0 4px 10px rgba(13, 148, 136, 0.2);
                }
                .pagination-arrow-btn {
                    width: 38px;
                    height: 38px;
                    border-radius: 50%;
                    border: 1px solid #e2e8f0;
                    background: white;
                    color: var(--text-main);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    box-shadow: var(--shadow-soft);
                    cursor: pointer;
                    transition: all 0.2s;
                }
                .pagination-arrow-btn:disabled {
                    opacity: 0.4;
                    cursor: not-allowed;
                }
                .bottom-modal-overlay {
                    position: fixed;
                    top: 0; left: 0; right: 0; bottom: 0;
                    background: rgba(15, 23, 42, 0.6);
                    backdrop-filter: blur(4px);
                    z-index: 2500;
                    display: flex;
                    align-items: flex-end;
                }
                .bottom-modal-sheet {
                    background: white;
                    width: 100%;
                    max-width: 600px;
                    margin: 0 auto;
                    border-radius: 24px 24px 0 0;
                    padding: 16px 24px calc(24px + env(safe-area-inset-bottom, 0px)) 24px;
                    box-shadow: 0 -10px 25px rgba(0,0,0,0.1);
                    animation: slideUpModal 0.35s cubic-bezier(0.16, 1, 0.3, 1);
                }
                @keyframes slideUpModal {
                    from { transform: translateY(100%); }
                    to { transform: translateY(0); }
                }
                .modal-drag-handle {
                    width: 40px;
                    height: 4px;
                    background: #cbd5e1;
                    border-radius: 2px;
                    margin: 0 auto 20px auto;
                }
                .modal-sheet-title {
                    font-size: 1.3rem;
                    font-weight: 800;
                    text-align: center;
                    color: var(--text-main);
                    margin: 0 0 20px 0;
                }
                .image-preview-container {
                    width: 100%;
                    height: 200px;
                    background: #f1f5f9;
                    border-radius: 16px;
                    overflow: hidden;
                    margin-bottom: 15px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                .image-preview-container img {
                    max-width: 100%;
                    max-height: 100%;
                    object-fit: contain;
                }
                .input-field-label {
                    font-size: 0.8rem;
                    text-transform: uppercase;
                    font-weight: 700;
                    color: var(--text-sub);
                    margin-bottom: 6px;
                    display: block;
                }
                .styled-modal-select {
                    width: 100%;
                    padding: 14px;
                    border-radius: 12px;
                    border: 1px solid #cbd5e1;
                    background: #f8fafc;
                    font-size: 0.95rem;
                    color: var(--text-main);
                }
                .styled-modal-input {
                    width: 100%;
                    padding: 14px;
                    border-radius: 12px;
                    border: 1px solid #cbd5e1;
                    background: #f8fafc;
                    font-size: 0.95rem;
                    color: var(--text-main);
                }
                .modal-btn {
                    flex: 1;
                    padding: 14px;
                    border-radius: 14px;
                    font-size: 1rem;
                    font-weight: 700;
                    border: none;
                    cursor: pointer;
                }
                .cancel-btn {
                    background: #e2e8f0;
                    color: var(--text-main);
                }
                .submit-btn {
                    background: linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%);
                    color: white;
                    box-shadow: 0 8px 20px rgba(13, 148, 136, 0.25);
                }
                .lightbox-overlay {
                    position: fixed;
                    top: 0; left: 0; right: 0; bottom: 0;
                    background: rgba(10, 15, 30, 0.92);
                    backdrop-filter: blur(12px);
                    z-index: 3000;
                    display: flex;
                    flex-direction: column;
                    justify-content: space-between;
                }
                .lightbox-image-container {
                    flex: 1;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 20px;
                    overflow: hidden;
                    user-select: none;
                }
                .lightbox-image-container img {
                    max-width: 100%;
                    max-height: 68vh;
                    object-fit: contain;
                    border-radius: 12px;
                    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
                }
                .lightbox-nav-btn {
                    position: absolute;
                    top: 50%;
                    transform: translateY(-50%);
                    width: 50px;
                    height: 50px;
                    border-radius: 50%;
                    background: rgba(255, 255, 255, 0.1);
                    backdrop-filter: blur(8px);
                    border: 1px solid rgba(255, 255, 255, 0.15);
                    color: white;
                    font-size: 1.8rem;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    transition: all 0.25s ease;
                    z-index: 3100;
                }
                .lightbox-nav-btn:hover {
                    background: rgba(255, 255, 255, 0.25);
                    transform: translateY(-50%) scale(1.08);
                }
                .prev-btn { left: 24px; }
                .next-btn { right: 24px; }
                
                .lightbox-top-bar {
                    padding: calc(20px + env(safe-area-inset-top, 0px)) 24px 20px 24px;
                    background: linear-gradient(to bottom, rgba(0,0,0,0.5), transparent);
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    z-index: 3200;
                    transition: all 0.3s ease;
                }
                .close-lightbox-btn {
                    background: transparent;
                    border: none;
                    color: white;
                    font-size: 2rem;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: transform 0.2s;
                }
                .close-lightbox-btn:hover {
                    transform: rotate(90deg);
                }
                .lightbox-badge {
                    background: var(--primary);
                    padding: 6px 14px;
                    border-radius: 20px;
                    font-size: 0.82rem;
                    font-weight: 700;
                    color: white;
                    box-shadow: 0 4px 10px rgba(13, 148, 136, 0.3);
                }
                .lightbox-view-controls {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                }
                .lightbox-control-action-btn {
                    background: rgba(255, 255, 255, 0.1);
                    backdrop-filter: blur(8px);
                    border: 1px solid rgba(255, 255, 255, 0.15);
                    color: white;
                    font-size: 1.25rem;
                    width: 36px;
                    height: 36px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    transition: all 0.2s ease;
                }
                .lightbox-control-action-btn:hover:not(:disabled) {
                    background: rgba(255, 255, 255, 0.25);
                    transform: scale(1.05);
                }
                .lightbox-control-action-btn.playing {
                    background: var(--primary);
                    border-color: var(--primary);
                    animation: pulsePlay 1.5s infinite;
                }
                @keyframes pulsePlay {
                    0% { box-shadow: 0 0 0 0 rgba(13, 148, 136, 0.6); }
                    70% { box-shadow: 0 0 0 10px rgba(13, 148, 136, 0); }
                    100% { box-shadow: 0 0 0 0 rgba(13, 148, 136, 0); }
                }
                .lightbox-control-action-btn:disabled {
                    opacity: 0.3;
                    cursor: not-allowed;
                }
                .zoom-text {
                    font-size: 0.8rem;
                    color: white;
                    font-weight: 700;
                    min-width: 32px;
                    text-align: center;
                    font-family: monospace;
                }
                .lightbox-bottom-container {
                    padding: 20px 24px calc(20px + env(safe-area-inset-bottom, 0px)) 24px;
                    background: linear-gradient(to top, rgba(0,0,0,0.7), transparent);
                    z-index: 3200;
                    transition: all 0.3s ease;
                }
                .lightbox-tools {
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    gap: 28px;
                    background: rgba(255, 255, 255, 0.08);
                    backdrop-filter: blur(20px);
                    border: 1px solid rgba(255, 255, 255, 0.15);
                    padding: 10px 28px;
                    border-radius: 30px;
                    width: max-content;
                    margin: 10px auto 0 auto;
                    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
                }
                .tool-action-btn {
                    background: transparent;
                    border: none;
                    color: #e2e8f0;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 4px;
                    font-size: 0.72rem;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s;
                }
                .tool-action-btn:hover {
                    color: white;
                    transform: translateY(-2px);
                }
                .danger-tool {
                    color: #fca5a5;
                }
                .danger-tool:hover {
                    color: #f87171;
                }
                .lightbox-thumbnails-strip {
                    display: flex;
                    gap: 8px;
                    overflow-x: auto;
                    padding: 12px 0 4px 0;
                    margin-top: 15px;
                    width: 100%;
                    max-width: 600px;
                    margin-left: auto;
                    margin-right: auto;
                    scroll-behavior: smooth;
                    -webkit-overflow-scrolling: touch;
                    justify-content: flex-start;
                }
                @media (max-width: 576px) {
                    .lightbox-thumbnails-strip {
                        max-width: 100%;
                    }
                }
                .lightbox-thumbnails-strip::-webkit-scrollbar {
                    height: 4px;
                }
                .lightbox-thumbnails-strip::-webkit-scrollbar-track {
                    background: transparent;
                }
                .lightbox-thumbnails-strip::-webkit-scrollbar-thumb {
                    background: rgba(255, 255, 255, 0.2);
                    border-radius: 2px;
                }
                .lightbox-thumbnail-item {
                    flex: 0 0 52px;
                    width: 52px;
                    height: 52px;
                    border-radius: 8px;
                    overflow: hidden;
                    cursor: pointer;
                    border: 2px solid transparent;
                    transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
                    opacity: 0.4;
                }
                .lightbox-thumbnail-item:hover {
                    opacity: 0.8;
                }
                .lightbox-thumbnail-item.active {
                    border-color: var(--primary);
                    transform: scale(1.08);
                    opacity: 1;
                    box-shadow: 0 0 12px rgba(13, 148, 136, 0.6);
                }
                .lightbox-thumbnail-item img {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                }
            `}</style>
        </>
    );
}
