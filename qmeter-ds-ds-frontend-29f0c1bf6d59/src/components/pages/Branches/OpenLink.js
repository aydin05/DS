import React, { useEffect, useRef, useState, useCallback } from "react";
import { useParams } from "react-router-dom";
import axiosClient, { AUTO_FETCH } from "../../../config";

const HEARTBEAT_INTERVAL = 30000; // 30 seconds

function OpenLink() {
  const params = useParams();
  const [previewData, setPreviewData] = useState({ general: {}, slides: [] });
  const [currentIndex, setCurrentIndex] = useState(0);
  const [tick, setTick] = useState(0); // Force re-render trigger for single-slide timer
  
  const timerRef = useRef(null);
  const autoFetchRef = useRef(null);

  // --- 1. Veri Çekme (Düzeltildi) ---
  const getData = useCallback(async () => {
    try {
      const res = await axiosClient(`display/display-detail?username=${params.username}`);
      const data = res.data;
      
      const formattedSlides = (data.slides || []).map((item) => ({
        ...item,
        items: (item.items || []).map((i) => ({
          ...i,
          type: i.type_content, // Tip hatası düzeltildi
          file: i.attr?.location,
        }))
      }));

      // Sadece veri gerçekten değiştiyse state güncelle (sonsuz döngü koruması)
      setPreviewData(prev => {
        if (JSON.stringify(prev.slides) === JSON.stringify(formattedSlides)) return prev;
        return { general: data.general || {}, slides: formattedSlides };
      });
    } catch (err) {
      console.error("API Error:", err);
    }
  }, [params.username]);

  // --- 2. Slayt Değiştirme Mantığı (Kritik Düzeltme) ---
  const nextSlide = useCallback(() => {
    setPreviewData(currentData => {
      if (currentData.slides.length > 0) {
        setCurrentIndex(prevIndex => (prevIndex + 1) % currentData.slides.length);
      }
      // Always bump tick so the timer effect re-fires even for single-slide playlists
      setTick(t => t + 1);
      return currentData;
    });
  }, []);

  // --- 3. Zamanlayıcı (Timer) Yönetimi ---
  useEffect(() => {
    // Timer'ı temizle
    if (timerRef.current) clearTimeout(timerRef.current);

    const slide = previewData.slides[currentIndex];
    if (!slide) return;

    const duration = (parseInt(slide.duration) || 5) * 1000;

    // Slayt değişimini başlat
    timerRef.current = setTimeout(() => {
      nextSlide();
    }, duration);

    return () => clearTimeout(timerRef.current);
  }, [currentIndex, tick, previewData.slides, nextSlide]); // tick ensures re-fire for single-slide

  // --- 4. İlk Çalıştırma ve Periyodik Güncelleme ---
  useEffect(() => {
    getData();
    autoFetchRef.current = setInterval(getData, AUTO_FETCH || 30000);
    return () => {
      clearInterval(autoFetchRef.current);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [getData]);

  // --- 4b. Heartbeat — report this OpenLink display as active ---
  useEffect(() => {
    const sendHeartbeat = () => {
      axiosClient.post("core/heartbeat/", {
        username: params.username,
        source: "openlink",
      }).catch(() => {});
    };
    sendHeartbeat();
    const hbInterval = setInterval(sendHeartbeat, HEARTBEAT_INTERVAL);
    return () => clearInterval(hbInterval);
  }, [params.username]);

  // --- 5. Render Yardımcısı ---
  const renderElement = (item) => {
    const style = {
      position: "absolute",
      width: `${item.width}px`,
      height: `${item.height}px`,
      top: `${item.top}px`,
      left: `${item.left}px`,
      zIndex: item.index,
    };

    let content;
    switch (item.type) {
      case "image":
        content = <div style={{ width: "100%", height: "100%", backgroundImage: `url(${item.file})`, backgroundSize: "contain", backgroundRepeat: "no-repeat", backgroundPosition: "center" }} />;
        break;
      case "video":
        content = (
          <video
            key={tick}
            src={item.file}
            autoPlay
            muted
            loop
            playsInline
            style={{ width: "100%", height: "100%", objectFit: "fill" }}
          />
        );
        break;
      case "text":
      case "globaltext":
        const textContent = <div dangerouslySetInnerHTML={{ __html: item.attr?.textarea }} />;
        content = item.attr?.is_scrolling ? (
          <marquee style={{ backgroundColor: item.attr?.frame_bg_color }} scrollamount={item.attr?.speed}>{textContent}</marquee>
        ) : (
          <div style={{ width: "100%", height: "100%", backgroundColor: item.attr?.frame_bg_color, overflow: "hidden" }}>{textContent}</div>
        );
        break;
      case "site":
        content = <iframe title="site" src={item.attr?.url} style={{ width: "100%", height: "100%", border: "none" }} />;
        break;
      default: content = null;
    }

    return <div key={item.position_id || Math.random()} style={style}>{content}</div>;
  };

  const currentSlide = previewData.slides[currentIndex];

  return (
    <div style={{ width: "100%", height: "100vh", backgroundColor: "#000", overflow: "hidden" }}>
      {currentSlide ? (
        <div
          style={{
            position: "relative",
            backgroundColor: currentSlide.bg_color,
            width: `${previewData.general?.width}px` || "100%",
            height: `${previewData.general?.height}px` || "100%",
            margin: "0 auto",
          }}
        >
          {currentSlide.items?.map(renderElement)}
        </div>
      ) : (
        <div style={{ color: "white", textAlign: "center", paddingTop: "20%" }}>Yükleniyor veya Slayt Bulunamadı...</div>
      )}
    </div>
  );
}

export default OpenLink;