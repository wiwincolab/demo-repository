"""Join all three original clips with a uniform picture, captions, and volume."""

import json
import math
import re
import subprocess
from pathlib import Path

from render import ass_time, milliseconds

HERE = Path(__file__).resolve().parent
PARTS = [
    ('source.mov', 'subtitles.zh-TW.srt', 'crop=2704:1520:0:148,'),
    ('source-part2.mp4', 'subtitles-part2.zh-TW.srt', ''),
    ('source-part3.mp4', 'subtitles-part3.zh-TW.srt', 'crop=1146:644:0:38,'),
]
OUTPUT = 'chictrip-pitch-20261013-full.zh-TW.mp4'


def srt_time(value):
    seconds, fraction = divmod(value, 1000)
    minutes, seconds = divmod(seconds, 60)
    hours, minutes = divmod(minutes, 60)
    return f'{hours:02}:{minutes:02}:{seconds:02},{fraction:03}'


def audio_normalization(source):
    # Measure after channel conversion so the mono second clip matches the
    # stereo clips. Apply the measured gain without changing speech timing.
    result = subprocess.run([
        'ffmpeg', '-hide_banner', '-nostdin', '-i', source, '-vn', '-af',
        'aresample=48000,aformat=sample_fmts=fltp:channel_layouts=stereo,'
        'loudnorm=I=-16:TP=-1.5:LRA=11:print_format=json', '-f', 'null', '-',
    ], cwd=HERE, capture_output=True, text=True, check=True)
    measured, _ = json.JSONDecoder().raw_decode(result.stderr[result.stderr.rfind('{'):])
    options = {
        'I': '-16', 'TP': '-1.5', 'LRA': '11',
        'measured_I': measured['input_i'],
        'measured_TP': measured['input_tp'],
        'measured_LRA': measured['input_lra'],
        'measured_thresh': measured['input_thresh'],
        'offset': measured['target_offset'], 'linear': 'true',
    }
    return 'loudnorm=' + ':'.join(f'{k}={v}' for k, v in options.items()), measured


def main():
    filters, captions, timings = [], [], []
    offset_frames = 0
    command = ['ffmpeg', '-hide_banner', '-nostdin', '-y']
    for index, (source, subtitle, crop) in enumerate(PARTS):
        duration = float(subprocess.check_output([
            'ffprobe', '-v', 'error', '-show_entries', 'format=duration',
            '-of', 'default=noprint_wrappers=1:nokey=1', source,
        ], cwd=HERE, text=True))
        # Round up to a complete video frame, preserving the final audio
        # samples and adding at most 1/30 second of silence to each clip.
        frames = math.ceil(duration * 30 - 1e-6)
        offset_ms = round(offset_frames * 1000 / 30)
        source_ms = round(duration * 1000)
        previous_end = 0
        for block in re.split(r'\n\s*\n', (HERE / subtitle).read_text().strip()):
            lines = block.splitlines()
            start_text, end_text = lines[1].split(' --> ')
            start, end = milliseconds(start_text), milliseconds(end_text)
            caption = '\n'.join(lines[2:])
            if start < previous_end or end <= start or end > source_ms or not caption:
                raise ValueError(f'Invalid caption in {subtitle}: {lines[0]}')
            captions.append((start + offset_ms, end + offset_ms, caption))
            previous_end = end

        normalization, measured = audio_normalization(source)
        timings.append({
            'part': index + 1, 'source': source, 'source_duration': duration,
            'start_frame': offset_frames, 'frames': frames,
            'start_seconds': offset_frames / 30, 'duration_seconds': frames / 30,
            'audio_measurement': measured,
        })
        command += ['-i', source]
        filters.append(
            f'[{index}:v:0]{crop}scale=1920:1080:flags=lanczos,setsar=1,'
            'pad=1920:1152:0:0:color=0x0c0f12,fps=30,'
            f'tpad=stop_mode=clone:stop_duration=1,trim=end_frame={frames},'
            f'settb=1/30,setpts=N[v{index}]'
        )
        filters.append(
            f'[{index}:a:0]aresample=48000,'
            f'aformat=sample_fmts=fltp:channel_layouts=stereo,{normalization},'
            f'aresample=48000,apad,atrim=end_sample={frames * 1600},'
            f'asetpts=N/SR/TB[a{index}]'
        )
        print(f'Prepared part {index + 1}: {frames / 30:.3f}s', flush=True)
        offset_frames += frames

    srt = '\n\n'.join(
        f'{number}\n{srt_time(start)} --> {srt_time(end)}\n{caption}'
        for number, (start, end, caption) in enumerate(captions, 1)
    ) + '\n'
    (HERE / 'subtitles-full.zh-TW.srt').write_text(srt, encoding='utf-8')
    vtt = re.sub(r'(\d{2}:\d{2}:\d{2}),(\d{3})', r'\1.\2', srt)
    (HERE / 'subtitles-full.zh-TW.vtt').write_text('WEBVTT\n\n' + vtt, encoding='utf-8')
    # Reuse the approved second clip's 1920 × 1152 subtitle style.
    ass = (HERE / 'subtitles-part2.zh-TW.ass').read_text().split('Dialogue:')[0]
    for start, end, caption in captions:
        escaped = caption.replace('\\', r'\\').replace('{', r'\{').replace('}', r'\}')
        escaped = escaped.replace('\n', r'\N')
        ass += f'Dialogue: 0,{ass_time(start)},{ass_time(end)},Default,,0,0,0,,{escaped}\n'
    (HERE / 'subtitles-full.zh-TW.ass').write_text(ass, encoding='utf-8')
    (HERE / 'merge-info.json').write_text(json.dumps({
        'fps': 30, 'width': 1920, 'height': 1152, 'frames': offset_frames,
        'duration_seconds': offset_frames / 30, 'caption_count': len(captions),
        'audio_target_lufs': -16, 'parts': timings,
    }, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    filters += [
        '[v0][a0][v1][a1][v2][a2]concat=n=3:v=1:a=1[video][audio]',
        '[video]ass=subtitles-full.zh-TW.ass[captioned]',
    ]
    command += [
        '-filter_complex', ';'.join(filters), '-map', '[captioned]', '-map', '[audio]',
        '-c:v', 'libx264', '-preset', 'medium', '-crf', '20', '-pix_fmt', 'yuv420p',
        '-r', '30', '-c:a', 'aac', '-b:a', '192k', '-ar', '48000', '-ac', '2',
        '-movflags', '+faststart', OUTPUT,
    ]
    subprocess.run(command, cwd=HERE, check=True)
    print(f'Merged {len(captions)} captions into {HERE / OUTPUT}')


if __name__ == '__main__':
    main()
