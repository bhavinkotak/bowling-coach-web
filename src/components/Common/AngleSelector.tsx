import type { CameraAngle } from '../../types';

interface AngleSelectorProps {
  value: CameraAngle;
  onChange: (angle: CameraAngle) => void;
  disabled?: boolean;
}

const cameraAngles: { value: CameraAngle; label: string; description: string; emoji: string }[] = [
  {
    value: 'front',
    label: 'Front View',
    description: 'Camera facing the bowler directly',
    emoji: '📹',
  },
  {
    value: 'side',
    label: 'Side View',
    description: 'Camera from the side angle',
    emoji: '📷',
  },
  {
    value: 'diagonal',
    label: 'Diagonal View',
    description: 'Camera at 45° angle',
    emoji: '🎥',
  },
];

export default function AngleSelector({
  value,
  onChange,
  disabled = false,
}: AngleSelectorProps) {
  return (
    <div className="space-y-3">
      <label htmlFor="camera-angle" className="block text-sm font-medium text-gray-700">
        Camera Angle
      </label>
      <select
        id="camera-angle"
        value={value}
        onChange={(e) => onChange(e.target.value as CameraAngle)}
        disabled={disabled}
        className="input-field w-full md:w-auto"
      >
        {cameraAngles.map((angle) => (
          <option key={angle.value} value={angle.value}>
            {angle.emoji} {angle.label} - {angle.description}
          </option>
        ))}
      </select>
    </div>
  );
}
