import { useCallback, useEffect, useRef, useState } from "react";
import {
  ArrowUpRight,
  BadgeCheck,
  MoveRight,
  RefreshCw,
  Wallet,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useAppearance } from "../../hooks/useAppearance";
import membershipArtwork from "../../assets/images/fitswap-3d-membership-cutout.png";
import "./FitSwapJourneySection.css";

const benefits = [
  {
    icon: Wallet,
    title: "Recover unused value",
    description:
      "Plans changed? List the eligible time left on your membership.",
  },
  {
    icon: BadgeCheck,
    title: "Make the handover clear",
    description:
      "Track the request, payment confirmation, seller and gym approvals.",
  },
  {
    icon: RefreshCw,
    title: "Give fitness a fresh start",
    description: "Find your next gym and put a verified membership to work.",
  },
];
const captions = [
  [
    "01 / Recover your value",
    "Your unused days have a next chapter.",
    "List eligible membership time and let someone else put it to work.",
  ],
  [
    "02 / Verify the handover",
    "A clear transfer. A verified next owner.",
    "The request, payment confirmation, seller and gym approvals stay visible.",
  ],
  [
    "03 / Keep moving",
    "One fresh start. More value for everyone.",
    "Discover a gym, choose a membership, and train with the original validity.",
  ],
];

function JourneyCanvas({ motion, onPhase, onError }) {
  const canvas = useRef(null);
  const controller = useRef(null);
  const motionPreference = useRef(motion);
  useEffect(() => {
    motionPreference.current = motion;
    controller.current?.setMotion(motion);
  }, [motion]);
  useEffect(() => {
    let cancelled = false;
    const element = canvas.current;
    import("./three/createJourneyScene")
      .then(({ createJourneyScene }) => {
        if (cancelled) return;
        controller.current = createJourneyScene(element, {
          onPhase,
          onReady: () => {
            element.dataset.ready = "true";
          },
          onError,
        });
        controller.current.setMotion(motionPreference.current);
      })
      .catch(() => {
        if (!cancelled) onError();
      });
    return () => {
      cancelled = true;
      controller.current?.dispose();
      controller.current = null;
    };
  }, [onError, onPhase]);
  return (
    <canvas
      ref={canvas}
      className="fit-journey-canvas"
      aria-hidden="true"
      data-testid="fitswap-journey-canvas"
    />
  );
}

export default function FitSwapJourneySection() {
  const { effectiveReducedMotion } = useAppearance();
  const container = useRef(null);
  const [inView, setInView] = useState(false);
  const [pageVisible, setPageVisible] = useState(() => !document.hidden);
  const [keyboardPaused, setKeyboardPaused] = useState(false);
  const [failed, setFailed] = useState(false);
  const [phase, setPhase] = useState(0);
  const onError = useCallback(() => setFailed(true), []);

  useEffect(() => {
    if (!window.IntersectionObserver) return;
    const observer = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      { threshold: 0.08 },
    );
    if (container.current) observer.observe(container.current);
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    const sync = () => setPageVisible(!document.hidden);
    document.addEventListener("visibilitychange", sync);
    return () => document.removeEventListener("visibilitychange", sync);
  }, []);

  const visible = inView || !window.IntersectionObserver;
  const active = visible && pageVisible && !failed;
  const caption = captions[phase];
  function handleMotionKey(event) {
    if (event.key === " " || event.key === "Enter") {
      event.preventDefault();
      setKeyboardPaused((current) => !current);
    }
  }

  return (
    <section
      id="the-fitswap-journey"
      className="fit-journey"
      aria-labelledby="fit-journey-title"
    >
      <div className="fit-journey-inner">
        <div className="fit-journey-intro">
          <div>
            <p className="fit-journey-eyebrow">
              <span /> THE FITSWAP EFFECT
            </p>
            <h2 id="fit-journey-title">
              One pass.
              <br />
              <span>A whole new chapter.</span>
            </h2>
          </div>
          <div className="fit-journey-lead">
            <p>
              Buy a membership that fits your life. Pass on the time you can’t
              use. Keep fitness moving, with a clear handover at every step.
            </p>
            <Link to="/login">
              Find your next pass <ArrowUpRight size={17} aria-hidden="true" />
            </Link>
          </div>
        </div>

        <figure
          className="fit-journey-scene"
          ref={container}
          tabIndex={0}
          role="img"
          aria-label="A FitSwap membership pass connects unused membership days, a verified transfer, and gym equipment for the next member. Press Space to pause or resume motion."
          onKeyDown={handleMotionKey}
        >
          <img
            className="fit-journey-poster"
            src={membershipArtwork}
            alt=""
            width="1024"
            height="1536"
            loading="lazy"
            decoding="async"
            aria-hidden="true"
          />
          {active && (
            <JourneyCanvas
              motion={!effectiveReducedMotion && !keyboardPaused}
              onPhase={setPhase}
              onError={onError}
            />
          )}
          <figcaption className="fit-journey-caption" aria-hidden="true">
            <p className="fit-journey-caption-step">{caption[0]}</p>
            <h3>{caption[1]}</h3>
            <p>{caption[2]}</p>
          </figcaption>
        </figure>

        <ol
          className="fit-journey-benefits"
          aria-label="How FitSwap passes value forward"
        >
          {benefits.map(({ icon: Icon, title, description }, index) => (
            <li key={title}>
              <div className="fit-journey-benefit-top">
                <Icon size={21} aria-hidden="true" />
                <span>0{index + 1}</span>
              </div>
              <h3>{title}</h3>
              <p>{description}</p>
              {index < benefits.length - 1 && (
                <MoveRight
                  className="fit-journey-step-arrow"
                  size={20}
                  aria-hidden="true"
                />
              )}
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
