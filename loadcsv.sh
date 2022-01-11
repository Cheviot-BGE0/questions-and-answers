CURRENTLINE=0
ENDLINE=0

while getopts "e:" opt; do
  case "$opt" in
    e)
      ENDLINE=${OPTARG}
    ;;
  esac
done

shift $(( OPTIND - 1 ))

echo "end: $ENDLINE"

INPUT="$1"
TARGET="$2"

echo "input: $INPUT"

while IFS= read -r line
do
  if [ $CURRENTLINE -gt 0 ]
  then
    echo "$CURRENTLINE: $line"
  else
    echo "Loading lines:"
  fi

  ((CURRENTLINE+=1))

  if [ $ENDLINE -gt 0 -a $CURRENTLINE -gt $ENDLINE ]; then
    break
  fi
done < "$INPUT"